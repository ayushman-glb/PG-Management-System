import { Router } from 'express';
import { Container } from '../../container';

const router = Router();

router.post('/orders', (req, res, next) => Container.billingController.createOrder(req, res, next));
router.post('/create-order', (req, res, next) => Container.billingController.createOrder(req, res, next));

router.post('/verify', (req, res, next) => Container.billingController.verifyPayment(req, res, next));
router.post('/verify-payment', (req, res, next) => Container.billingController.verifyPayment(req, res, next));

router.get('/invoices/:paymentId/pdf', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));
router.get('/invoices/:paymentId/download', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));

export default router;
