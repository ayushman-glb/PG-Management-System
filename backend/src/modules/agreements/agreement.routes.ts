import { Router } from 'express';
import { AgreementController } from './agreement.controller';
import { authenticate, requireRole } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const agreementController = new AgreementController();
const router = Router();

// Public verification endpoint (No auth required, returns non-sensitive metadata only)
router.get('/verify/:agreementNumber', agreementController.verifyAgreement);

// Protected routes
router.use(authenticate);

router.get('/', agreementController.listAgreements);
router.post('/', requireRole(Role.PG_OWNER, Role.ADMIN), agreementController.createAgreement);
router.get('/:id', agreementController.getAgreement);
router.patch('/:id', requireRole(Role.PG_OWNER, Role.ADMIN), agreementController.updateAgreement);
router.post('/:id/send', requireRole(Role.PG_OWNER, Role.ADMIN), agreementController.sendAgreement);
router.post('/:id/sign', agreementController.signAgreement);
router.get('/:id/pdf', agreementController.downloadPDF);

export { router as agreementRoutes };
