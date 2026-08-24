import { Router } from 'express';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const billingService = new BillingService();
const billingController = new BillingController(billingService);

const router = Router();

router.get('/invoices', authenticate, billingController.getInvoices);
router.get('/resident', authenticate, requireResident, billingController.getResidentInvoices);
router.get('/owner', authenticate, requireOwner, billingController.getOwnerInvoices);
router.get('/dues/:userId', authenticate, billingController.getUserDues);
router.post('/generate', authenticate, requireOwner, billingController.generateInvoice);

export { router as billingRoutes };
