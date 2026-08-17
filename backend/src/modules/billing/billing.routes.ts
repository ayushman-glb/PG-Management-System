import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// ── Webhook: no authenticate — Razorpay is external; signature validated via HMAC SHA256 ─
router.post('/webhook',
  (req, res, next) => Container.billingController.handleWebhook(req, res, next));

// All subsequent billing routes require authentication
router.use(authenticate);

// ── Fine management: OWNER / ADMIN only ──────────────────────────────────────
router.get('/fine-rules',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.getFineRules(req, res, next));

router.post('/fine-rules',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.createFineRule(req, res, next));

router.post('/fines',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.issueFine(req, res, next));

router.post('/fines/:fineId/waive',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.waiveFine(req, res, next));

// ── Resident fine lookup (resident sees their own fines) ─────────────────────
router.get('/residents/:residentId/fines',
  authorize(Role.RESIDENT, Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.getResidentFines(req, res, next));

// ── Payment orders (resident initiates, owner/admin can also) ────────────────
router.post('/orders',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.createOrder(req, res, next));

router.post('/create-order',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.createOrder(req, res, next));

// ── Payment verification ──────────────────────────────────────────────────────
router.post('/verify',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.verifyPayment(req, res, next));

router.post('/verify-payment',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.verifyPayment(req, res, next));

// ── Invoice / receipt download (resident sees their own; owner sees their PG) ─
router.get('/invoices/:paymentId/pdf',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));

router.get('/invoices/:paymentId/download',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.getInvoicePdf(req, res, next));

router.get('/receipts/:paymentId/pdf',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.getReceiptPdf(req, res, next));

router.get('/receipts/:paymentId/download',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.getReceiptPdf(req, res, next));

// ── Email dispatch for receipts and invoices ──────────────────────────────────
router.post('/send-receipt',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.sendReceipt(req, res, next));

router.post('/send-invoice',
  authorize(Role.RESIDENT, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN),
  (req, res, next) => Container.billingController.sendInvoice(req, res, next));

// ── Payment listing (owner / admin only) ─────────────────────────────────────
router.get('/payments',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.getPayments(req, res, next));

// ── Refunds (owner / admin only) ──────────────────────────────────────────────
router.post('/refunds',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.processRefund(req, res, next));

// ── Analytics (owner / admin only) ───────────────────────────────────────────
router.get('/analytics',
  authorize(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  (req, res, next) => Container.billingController.getAnalytics(req, res, next));

export default router;
