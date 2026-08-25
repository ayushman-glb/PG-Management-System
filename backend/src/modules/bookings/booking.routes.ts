import { Router } from 'express';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { authenticate, requireOwner, requireResident } from '../../middleware/authMiddleware';

const bookingService = new BookingService();
const bookingController = new BookingController(bookingService);

const router = Router();

router.get('/', authenticate, (req, res, next) => {
  if (req.user?.role === 'RESIDENT') {
    return bookingController.getResidentBookings(req, res, next);
  }
  return bookingController.getOwnerKanban(req, res, next);
});
router.post('/', authenticate, requireResident, bookingController.apply);
router.post('/apply', authenticate, requireResident, bookingController.apply);
router.get('/resident', authenticate, requireResident, bookingController.getResidentBookings);
router.get('/owner-kanban', authenticate, requireOwner, bookingController.getOwnerKanban);
router.post('/room-change', authenticate, requireResident, bookingController.requestRoomChange);
router.get('/:id', authenticate, bookingController.getBookingById);
router.post('/:id/cancel', authenticate, bookingController.cancel);
router.patch('/:id/status', authenticate, bookingController.updateStatus);
router.post('/:id/allocate', authenticate, requireOwner, bookingController.allocateRoom);

export { router as bookingRoutes };
