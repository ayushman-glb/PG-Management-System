import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.adminService.getDashboardStats();
      return ApiResponse.success(res, 'Admin stats retrieved.', stats);
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, query, search, page, limit } = req.query;
      const q = (search || query) as string;
      const data = await this.adminService.listUsers(role as any, q, page ? Number(page) : 1, limit ? Number(limit) : 20);
      return ApiResponse.success(res, 'Users retrieved.', data.users, {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  setUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive, isSuspended } = req.body;
      const user = await this.adminService.setUserStatus(id, Boolean(isActive), Boolean(isSuspended));
      return ApiResponse.success(res, 'User status updated.', user);
    } catch (error) {
      next(error);
    }
  };

  suspendUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isSuspended } = req.body;
      const user = await this.adminService.setUserStatus(id, !isSuspended, Boolean(isSuspended));
      return ApiResponse.success(res, 'User suspension status updated.', user);
    } catch (error) {
      next(error);
    }
  };

  getPGQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await this.adminService.getPGVerificationQueue();
      return ApiResponse.success(res, 'PG verification queue retrieved.', queue);
    } catch (error) {
      next(error);
    }
  };

  verifyPG = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      let { status, approved, rejectionReason, adminNotes } = req.body;
      if (!status && approved !== undefined) {
        status = approved ? 'ACTIVE' : 'REJECTED';
      }
      if (!status) throw new BadRequestError('status or approved flag is required.');

      const pg = await this.adminService.verifyPG(id, status, rejectionReason, adminNotes);
      return ApiResponse.success(res, `PG status updated to ${status}.`, pg);
    } catch (error) {
      next(error);
    }
  };

  getKYCQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await this.adminService.getKYCQueue();
      return ApiResponse.success(res, 'KYC verification queue retrieved.', queue);
    } catch (error) {
      next(error);
    }
  };

  verifyKYC = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      let { status, approved, rejectionReason } = req.body;
      if (!status && approved !== undefined) {
        status = approved ? 'VERIFIED' : 'REJECTED';
      }
      if (!status) throw new BadRequestError('status or approved flag is required.');

      const doc = await this.adminService.verifyKYCDocument(id, req.user.id, status, rejectionReason);
      return ApiResponse.success(res, `KYC document status updated to ${status}.`, doc);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, resource } = req.query;
      const data = await this.adminService.getAuditLogs(page ? Number(page) : 1, limit ? Number(limit) : 50, resource as string);
      return ApiResponse.success(res, 'Audit logs retrieved.', data.logs, {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getDeletionRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.adminService.listAccountDeletionRequests();
      return ApiResponse.success(res, 'Account deletion requests retrieved.', requests);
    } catch (error) {
      next(error);
    }
  };
}
