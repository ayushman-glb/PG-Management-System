import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction): void => {
  const tenantHeader = req.headers['x-tenant-id'] || req.headers['x-pg-id'];
  const tenantQuery = req.query.tenantId || req.query.pgId;
  const tenantBody = req.body?.tenantId || req.body?.pgId;

  const tenantId = (tenantHeader || tenantQuery || tenantBody) as string | undefined;

  if (tenantId) {
    req.tenantId = tenantId;
  }

  next();
};
