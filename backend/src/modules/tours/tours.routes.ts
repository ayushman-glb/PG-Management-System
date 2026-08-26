import { Router } from 'express';
import { TourController } from './tours.controller';
import { TourService } from './tours.service';
import { authenticate } from '../../middleware/authMiddleware';

const tourService = new TourService();
const tourController = new TourController(tourService);

const router = Router();

router.use(authenticate);

router.post('/', tourController.requestTour);
router.get('/', tourController.getTours);
router.patch('/:id', tourController.updateTourStatus);

export { router as tourRoutes };
