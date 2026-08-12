import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';

/**
 * Asserts that the authenticated user owns the Owner record identified by `req.params[paramName]`.
 * Returns 403 if mismatch, 404 if the owner record does not exist.
 * Attaches `req.owner` for downstream handlers to avoid a duplicate lookup.
 */
export function assertOwnershipOf(paramName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const ownerId = req.params[paramName];
    if (!ownerId) {
      res.status(400).json({ success: false, message: `Missing route param: ${paramName}` });
      return;
    }

    const owner = await Container.db.owner.findUnique({ where: { id: ownerId } });
    if (!owner) {
      res.status(404).json({ success: false, message: 'Owner record not found.' });
      return;
    }

    // RBAC tenant check: the JWT user must own this Owner record
    if (owner.userId !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden — you do not have permission to access this owner record.',
      });
      return;
    }

    (req as any).owner = owner;
    next();
  };
}

/**
 * Asserts that the authenticated user owns the PG identified by `req.params[paramName]`.
 * Resolves ownership by checking PG.ownerId → Owner.userId === req.user.id.
 * Returns 403 if mismatch, 404 if PG does not exist.
 * Attaches `req.pg` for downstream handlers.
 */
export function assertPGOwnership(paramName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pgId = req.params[paramName];
    if (!pgId) {
      res.status(400).json({ success: false, message: `Missing route param: ${paramName}` });
      return;
    }

    const pg = await Container.db.pG.findUnique({ where: { id: pgId } });
    if (!pg) {
      res.status(404).json({ success: false, message: 'PG record not found.' });
      return;
    }

    // Walk PG → Owner → User
    const owner = await Container.db.owner.findUnique({ where: { id: pg.ownerId } });
    if (!owner || owner.userId !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden — you do not own this PG.',
      });
      return;
    }

    (req as any).pg = pg;
    (req as any).owner = owner;
    next();
  };
}
