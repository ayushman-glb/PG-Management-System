import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';

export class DocumentController {
  constructor(private readonly documentService: DocumentService = new DocumentService()) {}

  getUserDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { userId } = req.query;
      const documents = await this.documentService.getUserDocuments(
        req.user.id,
        req.user.role,
        userId as string | undefined
      );
      return ApiResponse.success(res, 'User documents retrieved successfully.', documents);
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const uploadResult = (req as any).uploadResult;
      if (!uploadResult) {
        throw new BadRequestError('Upload payload missing from security pipeline.');
      }

      const document = await this.documentService.uploadDocument(
        req.user.id,
        req.body,
        uploadResult
      );
      return ApiResponse.success(res, 'Document uploaded and registered successfully.', document, 201);
    } catch (error) {
      next(error);
    }
  };

  reuploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const uploadResult = (req as any).uploadResult;
      if (!uploadResult) {
        throw new BadRequestError('Upload payload missing from security pipeline.');
      }

      const updated = await this.documentService.reuploadDocument(
        req.user.id,
        id,
        uploadResult
      );
      return ApiResponse.success(res, 'Document re-uploaded with version increment successfully.', updated, 201);
    } catch (error) {
      next(error);
    }
  };

  getDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const doc = await this.documentService.getDocumentById(id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Document retrieved successfully.', doc);
    } catch (error) {
      next(error);
    }
  };

  getVersionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const history = await this.documentService.getVersionHistory(id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Document version history retrieved.', history);
    } catch (error) {
      next(error);
    }
  };

  verifyDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      if (!status) throw new BadRequestError('Verification status is required.');

      const verified = await this.documentService.verifyDocument(req.user.id, id, {
        status,
        rejectionReason,
      });
      return ApiResponse.success(res, 'Document verification status updated.', verified);
    } catch (error) {
      next(error);
    }
  };
}
