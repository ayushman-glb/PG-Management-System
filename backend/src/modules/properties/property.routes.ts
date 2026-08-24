import { Router } from 'express';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { authenticate, requireOwner, requireAdmin } from '../../middleware/authMiddleware';

const propertyService = new PropertyService();
const propertyController = new PropertyController(propertyService);

const router = Router();

router.get('/', authenticate, requireOwner, propertyController.getOwnerPGs);
router.get('/my', authenticate, requireOwner, propertyController.getOwnerPGs);
router.get('/owner', authenticate, requireOwner, propertyController.getOwnerPGs);
router.get('/owner-summary', authenticate, requireOwner, propertyController.getOwnerPGs);
router.post('/', authenticate, requireOwner, propertyController.createPG);
router.get('/:id', authenticate, propertyController.getPGDetails);
router.post('/:id/floors', authenticate, requireOwner, propertyController.addFloor);
router.patch('/:id/verify', authenticate, requireAdmin, propertyController.updateStatus);

export { router as propertyRoutes };
