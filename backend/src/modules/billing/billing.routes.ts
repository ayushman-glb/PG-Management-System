import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';
import { verifyRecaptcha } from '../../middleware/recaptcha.middleware';

const router = Router();

router.use(authenticate);

router.post('/orders', verifyRecaptcha('payment'), (req, res, next) => Container.billingController.createOrder(req, res, next));
router.post('/create-order', verifyRecaptcha('payment'), (req, res, next) => Container.billingController.createOrder(req, res, next));

router.post('/verify', verifyRecaptcha('payment'), (req, res, next) => Container.billingController.verifyPayment(req, res, next));
router.post('/verify-payment', verifyRecaptcha('payment'), (req, res, next) => Container.billingController.verifyPayment(req, res, next));

router.get('/invoices/:paymentId/pdf', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));
router.get('/invoices/:paymentId/download', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));

export default router;
