import { Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  createApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const application = await this.applicationService.createApplication(req.user.id, req.body);
      return ApiResponse.success(res, 'Rental application submitted successfully.', application, 201);
    } catch (error) {
      next(error);
    }
  };

  getApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const applications = await this.applicationService.getApplications(req.user.id, req.user.role);
      return ApiResponse.success(res, 'Applications retrieved successfully.', applications);
    } catch (error) {
      next(error);
    }
  };

  getApplicationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const application = await this.applicationService.getApplicationById(req.params.id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Application retrieved successfully.', application);
    } catch (error) {
      next(error);
    }
  };

  updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const updated = await this.applicationService.updateApplicationStatus(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body
      );
      return ApiResponse.success(res, `Application status updated to ${updated.status}.`, updated);
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const updated = await this.applicationService.uploadDocument(req.params.id, req.user.id, req.body);
      return ApiResponse.success(res, 'Document uploaded to application.', updated);
    } catch (error) {
      next(error);
    }
  };

  signLease = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const updated = await this.applicationService.signLease(req.params.id, req.user.id, req.body);
      return ApiResponse.success(res, 'Digital lease agreement signed successfully.', updated);
    } catch (error) {
      next(error);
    }
  };
}
