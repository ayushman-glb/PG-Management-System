import { Router } from 'express';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const billingService = new BillingService();
const billingController = new BillingController(billingService);

const router = Router();

router.use(authenticate);

router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id/pdf', billingController.downloadInvoicePdf);
router.get('/invoices/:id/download', billingController.downloadInvoicePdf);
router.get('/invoices/:id', billingController.getInvoiceById);
router.get('/resident', requireResident, billingController.getResidentInvoices);
router.get('/owner', requireOwner, billingController.getOwnerInvoices);
router.get('/dues/:userId', billingController.getUserDues);
router.post('/generate', requireOwner, billingController.generateInvoice);

// Fines
router.get('/fines', billingController.getFines);
router.post('/fines', requireOwner, billingController.levyFine);
router.post('/fines/:id/waive', requireOwner, billingController.waiveFine);

export { router as billingRoutes };
