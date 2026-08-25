import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { authenticate, requireOwner } from '../../middleware/authMiddleware';

const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

const router = Router();

router.post('/razorpay/order', authenticate, paymentController.createOrder);
router.post('/create-order', authenticate, paymentController.createOrder);
router.post('/razorpay/verify', authenticate, paymentController.verifyRazorpay);
router.post('/verify', authenticate, paymentController.verifyRazorpay);
router.post('/razorpay/webhook', paymentController.handleWebhook);
router.post('/manual', authenticate, paymentController.submitManual);
router.patch('/manual/:id/verify', authenticate, requireOwner, paymentController.verifyManual);
router.get('/history', authenticate, paymentController.getHistory);
router.post('/:id/refund', authenticate, requireOwner, paymentController.refundPayment);
router.get('/:id/receipt', authenticate, paymentController.downloadReceipt);
router.get('/:id/pdf', authenticate, paymentController.downloadReceipt);

export { router as paymentRoutes };
