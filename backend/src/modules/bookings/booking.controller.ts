import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { ApiResponse } from '../../utils/apiResponse';
import { BadRequestError } from '../../core/errors/CustomErrors';
import { AuthRequest } from '../../middleware/authMiddleware';

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  apply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId, roomId, bedId, roomType, preferredMoveInDate, expectedStayMonths } = req.body;
      if (!pgId || !roomType || !preferredMoveInDate) {
        throw new BadRequestError('pgId, roomType, and preferredMoveInDate are required.');
      }

      const booking = await this.bookingService.applyBooking({
        residentId: req.user.id,
        pgId,
        roomId,
        bedId,
        roomType,
        preferredMoveInDate,
        expectedStayMonths: expectedStayMonths ? Number(expectedStayMonths) : 6,
      });

      return ApiResponse.success(res, 'Booking application submitted successfully.', booking, 201);
    } catch (error) {
      next(error);
    }
  };

  getOwnerKanban = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { pgId } = req.query;
      const kanban = await this.bookingService.getOwnerKanban(req.user.id, pgId as string);
      return ApiResponse.success(res, 'Owner Kanban board data retrieved.', kanban);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { toStatus, reason } = req.body;
      if (!toStatus) throw new BadRequestError('toStatus is required.');

      const booking = await this.bookingService.updateBookingStatus(id, req.user.id, req.user.role, toStatus, reason);
      return ApiResponse.success(res, `Booking transitioned to ${toStatus}`, booking);
    } catch (error) {
      next(error);
    }
  };

  allocateRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { floorId, roomId, bedId } = req.body;
      if (!floorId || !roomId || !bedId) {
        throw new BadRequestError('floorId, roomId, and bedId are required.');
      }

      const result = await this.bookingService.allocateRoomAndBed(id, req.user.id, floorId, roomId, bedId);
      return ApiResponse.success(res, 'Room and bed allocated successfully. Booking confirmed and agreement generated.', result);
    } catch (error) {
      next(error);
    }
  };

  getResidentBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const bookings = await this.bookingService.getResidentBookings(req.user.id);
      return ApiResponse.success(res, 'Resident bookings retrieved.', bookings);
    } catch (error) {
      next(error);
    }
  };

  requestRoomChange = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { currentAllocationId, requestedRoomType, reason } = req.body;
      if (!currentAllocationId || !requestedRoomType || !reason) {
        throw new BadRequestError('currentAllocationId, requestedRoomType, and reason are required.');
      }

      const request = await this.bookingService.requestRoomChange(req.user.id, currentAllocationId, requestedRoomType, reason);
      return ApiResponse.success(res, 'Room change request submitted for owner review.', request, 201);
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id, req.user.id, req.user.role);
      return ApiResponse.success(res, 'Booking details retrieved.', booking);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new BadRequestError('User context missing.');
      const { id } = req.params;
      const { cancellationReason } = req.body;
      const result = await this.bookingService.cancelBooking(id, req.user.id, req.user.role, cancellationReason || 'Resident cancelled booking');
      return ApiResponse.success(res, 'Booking cancelled successfully.', result);
    } catch (error) {
      next(error);
    }
  };
}
