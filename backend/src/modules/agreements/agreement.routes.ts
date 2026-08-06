import { Router } from 'express';
import { Container } from '../../container';

import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/generate', (req, res, next) => Container.agreementController.generate(req, res, next));
router.get('/:id', (req, res, next) => Container.agreementController.getById(req, res, next));
router.post('/:id/sign', (req, res, next) => Container.agreementController.sign(req, res, next));
router.get('/:id/pdf', (req, res, next) => Container.agreementController.downloadPdf(req, res, next));
router.get('/:id/download', (req, res, next) => Container.agreementController.downloadPdf(req, res, next));
router.get('/verify/:agreementNumber', (req, res, next) => Container.agreementController.verify(req, res, next));
router.get('/resident/:residentId', (req, res, next) => Container.agreementController.getResidentAgreements(req, res, next));

export default router;
