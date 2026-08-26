import { Router } from 'express';
import { ShortlistController } from './shortlist.controller';
import { ShortlistService } from './shortlist.service';
import { authenticate } from '../../middleware/authMiddleware';

const shortlistService = new ShortlistService();
const shortlistController = new ShortlistController(shortlistService);

const router = Router();

router.use(authenticate);

router.get('/', shortlistController.getShortlist);
router.post('/sync', shortlistController.syncShortlist);
router.post('/:propertyId', shortlistController.toggleShortlist);
router.delete('/:propertyId', shortlistController.removeFromShortlist);

export { router as shortlistRoutes };
