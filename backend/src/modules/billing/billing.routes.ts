import { Router } from 'express';
import { Container } from '../../container';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/payments', (req, res, next) => Container.billingController.getPayments(req, res, next));
router.get('/fine-rules', (req, res, next) => Container.billingController.getFineRules(req, res, next));
router.post('/fine-rules', (req, res, next) => Container.billingController.createFineRule(req, res, next));
router.get('/residents/:residentId/fines', (req, res, next) => Container.billingController.getResidentFines(req, res, next));
router.post('/fines', (req, res, next) => Container.billingController.issueFine(req, res, next));
router.post('/fines/:fineId/waive', (req, res, next) => Container.billingController.waiveFine(req, res, next));

router.post('/orders', (req, res, next) => Container.billingController.createOrder(req, res, next));
router.post('/create-order', (req, res, next) => Container.billingController.createOrder(req, res, next));

router.post('/verify', (req, res, next) => Container.billingController.verifyPayment(req, res, next));
router.post('/verify-payment', (req, res, next) => Container.billingController.verifyPayment(req, res, next));

router.get('/invoices/:paymentId/pdf', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));
router.get('/invoices/:paymentId/download', (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));

router.get('/receipts/:paymentId/pdf', (req, res, next) => Container.billingController.getReceiptPdf(req, res, next));
router.get('/receipts/:paymentId/download', (req, res, next) => Container.billingController.getReceiptPdf(req, res, next));

router.post('/refunds', (req, res, next) => Container.billingController.processRefund(req, res, next));
router.post('/webhook', (req, res, next) => Container.billingController.handleWebhook(req, res, next));
router.get('/analytics', (req, res, next) => Container.billingController.getAnalytics(req, res, next));

export default router;
