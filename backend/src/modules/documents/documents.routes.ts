import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// All document download routes require authentication
router.use(authenticate);

// ─── Typed download routes (new centralized API) ──────────────────────────────
// GET /api/v1/documents/:entityId/:type  — generic download by type
router.get('/:entityId/:type', (req, res, next) =>
  Container.documentController.download(req as any, res, next)
);

// ─── Named convenience routes ─────────────────────────────────────────────────
// GET /api/v1/documents/invoice/:paymentId
router.get('/invoice/:entityId', (req, res, next) =>
  Container.documentController.downloadInvoice(req as any, res, next)
);

// GET /api/v1/documents/receipt/:paymentId
router.get('/receipt/:entityId', (req, res, next) =>
  Container.documentController.downloadReceipt(req as any, res, next)
);

// GET /api/v1/documents/agreement/:agreementId
router.get('/agreement/:entityId', (req, res, next) =>
  Container.documentController.downloadAgreement(req as any, res, next)
);

// GET /api/v1/documents/kyc/:residentId
router.get('/kyc/:entityId', (req, res, next) =>
  Container.documentController.downloadKyc(req as any, res, next)
);

// GET /api/v1/documents/refund/:paymentId
router.get('/refund/:entityId', (req, res, next) =>
  Container.documentController.downloadRefund(req as any, res, next)
);

// GET /api/v1/documents/status/:documentKey  — poll generation status
router.get('/status/:documentKey', (req, res, next) =>
  Container.documentController.getStatus(req as any, res, next)
);

export default router;
