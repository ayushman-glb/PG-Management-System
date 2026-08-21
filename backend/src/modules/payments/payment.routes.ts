import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';
import { paymentController } from './payment.controller';

const router = Router();

// ── Webhook Endpoint (Public — signature verified via HMAC SHA256) ───────────
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(authenticate);

// Order creation & payment verification
router.post('/create-order', (req, res, next) => paymentController.createOrder(req, res, next));
router.post('/verify', (req, res, next) => paymentController.verifyPayment(req, res, next));
router.post('/verify-payment', (req, res, next) => paymentController.verifyPayment(req, res, next));

// Payment history & single lookup
router.get('/history', (req, res, next) => paymentController.getPaymentHistory(req, res, next));
router.get('/analytics', (req, res, next) => paymentController.getPaymentAnalytics(req, res, next));
router.get('/export/csv', (req, res, next) => paymentController.exportPaymentsCsv(req, res, next));
router.get('/:id', (req, res, next) => paymentController.getPaymentById(req, res, next));
router.get('/:id/invoice', (req, res, next) => paymentController.getPaymentInvoice(req, res, next));

// Refunds (Owner / Admin only)
router.post('/:id/refund',
  authorize(Role.OWNER, Role.GOD, Role.ADMIN),
  (req, res, next) => paymentController.processRefund(req, res, next)
);

// Delete payment record (Super Admin / Admin only)
router.delete('/:id',
  authorize(Role.GOD, Role.ADMIN),
  (req, res, next) => paymentController.deletePayment(req, res, next)
);

export default router;
