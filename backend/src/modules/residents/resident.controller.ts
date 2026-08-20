import { Response } from 'express';
import { IResidentService } from '../../interfaces/services/IResidentService';
import { catchAsync, AppError } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';
import { Role } from '@prisma/client';

/** Returns the list of pgIds owned by the authenticated OWNER user. Empty for non-owners. */
async function getOwnerPgIds(userId: string): Promise<string[]> {
  const owner = await Container.db.owner.findFirst({ where: { userId }, select: { id: true } });
  if (!owner) return [];
  const pgs = await Container.db.pG.findMany({ where: { ownerId: owner.id }, select: { id: true } });
  return pgs.map((p: any) => p.id);
}

export class ResidentController {
  constructor(private readonly residentService: IResidentService) {}

  onboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const result = await this.residentService.onboardResident({ ...req.body, userId });
    return ApiResponse.success(res, 'KYC onboarding successfully submitted', result, undefined, 201);
  });

  getDirectory = catchAsync(async (req: AuthRequest, res: Response) => {
    const { propertyId, search, status } = req.query;
    const role = req.user?.role as Role;

    let scopedPropertyId = propertyId as string | undefined;

    // OWNER: derive authorized PG IDs from the JWT user — never trust the client
    if (role === Role.OWNER || role === Role.MANAGER) {
      const ownerPgIds = await getOwnerPgIds(req.user!.id);
      if (scopedPropertyId && !ownerPgIds.includes(scopedPropertyId)) {
        return ApiResponse.error(res, 'Forbidden: you do not own the requested property', [], 403, 'FORBIDDEN');
      }
      // If no propertyId specified, scope to all their PGs
      if (!scopedPropertyId && ownerPgIds.length > 0) {
        scopedPropertyId = ownerPgIds[0]; // Default to first owned PG; caller can narrow with ?propertyId=
      }
    }

    const residents = await this.residentService.getDirectory({
      propertyId: scopedPropertyId,
      search: search as string,
      status: status as string,
    });
    return ApiResponse.success(res, 'Resident directory fetched', residents);
  });

  getPortalMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const data = await this.residentService.getPortalData(userId);
    return ApiResponse.success(res, 'Resident portal data fetched', data);
  });

  createVisitorPass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const pass = await this.residentService.createVisitorPass(userId, req.body);
    return ApiResponse.success(res, 'Visitor pass created successfully with QR code', pass, undefined, 201);
  });

  createGatePass = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const pass = await this.residentService.createGatePass(userId, req.body);
    return ApiResponse.success(res, 'Gate pass submitted successfully', pass, undefined, 201);
  });

  toggleMealSkip = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', undefined, 401);
    }
    const { date, mealType } = req.body;
    const result = await this.residentService.toggleMealSkip(userId, date, mealType);
    return ApiResponse.success(res, result.message, result);
  });

  getResidentById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const role = req.user?.role as Role;
    const resident = await Container.db.resident.findUnique({ where: { id } });
    if (!resident) {
      return ApiResponse.error(res, 'Resident not found', undefined, 404);
    }
    // OWNER: verify they own the PG this resident belongs to
    if (role === Role.OWNER || role === Role.MANAGER) {
      const ownerPgIds = await getOwnerPgIds(req.user!.id);
      if (resident.pgId && !ownerPgIds.includes(resident.pgId)) {
        return ApiResponse.error(res, 'Forbidden: resident does not belong to your property', [], 403, 'FORBIDDEN');
      }
    }
    return ApiResponse.success(res, 'Resident retrieved', resident);
  });

  updateStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId } = req.params;
    const { status, reason } = req.body;
    const role = req.user?.role as Role;
    if (!residentId || !status) {
      return ApiResponse.error(res, 'Resident ID and status are required', undefined, 400);
    }
    const existing = await Container.db.resident.findUnique({ where: { id: residentId } });
    if (!existing) {
      return ApiResponse.error(res, 'Resident record not found', undefined, 404);
    }
    // OWNER: verify they own the PG before evicting/updating the resident's status
    if (role === Role.OWNER || role === Role.MANAGER) {
      const ownerPgIds = await getOwnerPgIds(req.user!.id);
      if (existing.pgId && !ownerPgIds.includes(existing.pgId)) {
        return ApiResponse.error(res, 'Forbidden: you do not own the property this resident belongs to', [], 403, 'FORBIDDEN');
      }
    }
    const updated = await Container.db.resident.update({
      where: { id: residentId },
      data: { status: status as any }
    });
    await Container.db.residentStatusHistory.create({
      data: {
        residentId,
        status: status as any,
        reason,
        updatedBy: req.user?.id || 'system'
      }
    });
    return ApiResponse.success(res, 'Resident status updated', updated);
  });

  getStatusHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId } = req.params;
    const role = req.user?.role as Role;
    // OWNER: verify they own the PG before exposing status audit trail
    if (role === Role.OWNER || role === Role.MANAGER) {
      const resident = await Container.db.resident.findUnique({ where: { id: residentId } });
      if (resident) {
        const ownerPgIds = await getOwnerPgIds(req.user!.id);
        if (resident.pgId && !ownerPgIds.includes(resident.pgId)) {
          return ApiResponse.error(res, 'Forbidden: resident does not belong to your property', [], 403, 'FORBIDDEN');
        }
      }
    }
    const history = await Container.db.residentStatusHistory.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }
    });
    return ApiResponse.success(res, 'Resident status history retrieved', history);
  });

  getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || (req as any).user?.userId || req.params.userId;
    const resident = await Container.db.resident.findUnique({
      where: { userId },
      include: { pg: true, bed: true }
    });
    if (!resident) {
      return ApiResponse.error(res, 'Resident profile not found', undefined, 404);
    }
    return ApiResponse.success(res, 'Resident profile retrieved', resident);
  });
}
