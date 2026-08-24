import { Router } from 'express';
import { AgreementController } from './agreement.controller';
import { AgreementService } from './agreement.service';
import { authenticate } from '../../middleware/authMiddleware';

const agreementService = new AgreementService();
const agreementController = new AgreementController(agreementService);

const router = Router();

router.get('/', authenticate, agreementController.listAgreements);
router.get('/:id', authenticate, agreementController.getAgreement);
router.post('/:id/sign', authenticate, agreementController.signAgreement);
router.get('/:id/pdf', authenticate, agreementController.downloadPDF);

export { router as agreementRoutes };
