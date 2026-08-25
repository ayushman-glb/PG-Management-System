import { AnalyticsService } from '../modules/analytics/analytics.service';
import { BillingService } from '../modules/billing/billing.service';
import { PaymentService } from '../modules/payments/payment.service';
import { BookingService } from '../modules/bookings/booking.service';
import { ComplaintService } from '../modules/complaints/complaint.service';
import { RoomService } from '../modules/rooms/room.service';
import { SearchService } from '../modules/search/search.service';
import { SubscriptionService } from '../modules/subscriptions/subscription.service';
import { OwnerService } from '../modules/owners/owner.service';
import { UploadController } from '../utils/upload.controller';
import { Role, PaymentStatus, InvoiceStatus, BookingStatus, RoomType, PGStatus, ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@prisma/client';


describe('API Contract Integrity & Module Sweep', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      pG: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      bookingStatusHistory: {
        create: jest.fn(),
      },
      expense: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      complaint: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      complaintStatusHistory: {
        create: jest.fn(),
      },
      room: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      floor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      bed: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      subscriptionPlan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      userProfile: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockDb)),
    };
    (global as any).prismaSingleton = mockDb;
  });

  afterEach(() => {
    delete (global as any).prismaSingleton;
  });

  describe('1. Analytics Service API Contracts', () => {
    it('should aggregate revenue analytics by period and pgId', async () => {
      const analyticsService = new AnalyticsService();
      mockDb.pG.findMany.mockResolvedValue([{ id: 'pg_1' }]);
      mockDb.payment.findMany.mockResolvedValue([
        { amount: 15000, createdAt: new Date('2026-08-01') },
        { amount: 12000, createdAt: new Date('2026-08-15') },
      ]);

      const result = await analyticsService.getRevenueAnalytics('owner_1', 'monthly', 'pg_1');
      expect(result.summary).toHaveProperty('period', 'monthly');
      expect(result.summary).toHaveProperty('totalRevenue', 27000);
      expect(result.revenueData.length).toBeGreaterThan(0);
    });

    it('should calculate occupancy metrics for owner', async () => {
      const analyticsService = new AnalyticsService();
      mockDb.pG.findMany.mockResolvedValue([
        {
          id: 'pg_1',
          name: 'Indiranagar Luxe',
          floors: [
            {
              rooms: [
                { beds: [{ status: 'OCCUPIED' }, { status: 'AVAILABLE' }] },
              ],
            },
          ],
        },
      ]);

      const result = await analyticsService.getOccupancyAnalytics('owner_1', 'pg_1');
      expect(result.totalBeds).toBe(2);
      expect(result.occupiedBeds).toBe(1);
      expect(result.occupancyRate).toBe(50);
    });
  });

  describe('2. Billing & Payment Service API Contracts', () => {
    it('should retrieve invoice by id with role authorization', async () => {
      const billingService = new BillingService();
      const mockInvoice = {
        id: 'inv_123',
        residentId: 'res_1',
        pg: { ownerId: 'owner_1' },
        items: [],
      };
      mockDb.invoice.findUnique.mockResolvedValue(mockInvoice);

      const res = await billingService.getInvoiceById('inv_123', 'res_1', Role.RESIDENT);
      expect(res.id).toBe('inv_123');
    });

    it('should process payment refunds correctly and update invoice balance', async () => {
      const paymentService = new PaymentService();
      const mockPayment = {
        id: 'pay_123',
        amount: 10000,
        payeeId: 'owner_1',
        invoiceId: 'inv_123',
        pg: { ownerId: 'owner_1' },
      };
      mockDb.payment.findUnique.mockResolvedValue(mockPayment);
      mockDb.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.REFUNDED });

      const refundResult = await paymentService.processRefund('pay_123', 'owner_1', Role.PG_OWNER, 5000, 'Partial refund');
      expect(refundResult.success).toBe(true);
      expect(refundResult.refundedAmount).toBe(5000);
      expect(mockDb.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv_123' },
          data: { status: InvoiceStatus.UNPAID, balanceDue: { increment: 5000 } },
        })
      );
    });
  });

  describe('3. Booking Service API Contracts', () => {
    it('should get booking by ID and allow cancellation', async () => {
      const bookingService = new BookingService();
      const mockBooking = {
        id: 'book_123',
        residentId: 'res_1',
        pgId: 'pg_1',
        status: BookingStatus.APPLIED,
        pg: { ownerId: 'owner_1' },
      };
      mockDb.booking.findUnique.mockResolvedValue(mockBooking);
      mockDb.booking.update.mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

      const booking = await bookingService.getBookingById('book_123', 'res_1', Role.RESIDENT);
      expect(booking.id).toBe('book_123');

      const cancelled = await bookingService.cancelBooking('book_123', 'res_1', Role.RESIDENT, 'Plans changed');
      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('4. Complaint Service API Contracts', () => {
    it('should get complaint by ID and acknowledge resolution', async () => {
      const complaintService = new ComplaintService();
      const mockComplaint = {
        id: 'comp_123',
        residentId: 'res_1',
        status: ComplaintStatus.RESOLVED,
        pg: { ownerId: 'owner_1' },
      };
      mockDb.complaint.findUnique.mockResolvedValue(mockComplaint);
      mockDb.complaint.update.mockResolvedValue({ ...mockComplaint, status: ComplaintStatus.CLOSED });

      const complaint = await complaintService.getComplaintById('comp_123', 'res_1', Role.RESIDENT);
      expect(complaint.id).toBe('comp_123');

      const ack = await complaintService.acknowledgeResolution('comp_123', 'res_1', true);
      expect(ack.status).toBe(ComplaintStatus.CLOSED);
    });
  });

  describe('5. Room Conversion & Search Autocomplete API Contracts', () => {
    it('should convert room sharing type', async () => {
      const roomService = new RoomService();
      const mockRoom = {
        id: 'room_1',
        roomType: RoomType.SINGLE,
        pg: { ownerId: 'owner_1' },
        beds: [{ id: 'bed_1' }],
      };
      mockDb.room.findUnique.mockResolvedValue(mockRoom);
      mockDb.room.update.mockResolvedValue({ ...mockRoom, roomType: RoomType.DOUBLE });

      const converted = await roomService.convertRoom('room_1', 'owner_1', RoomType.DOUBLE);
      expect(converted.roomType).toBe(RoomType.DOUBLE);
    });

    it('should return autocomplete suggestions', async () => {
      const searchService = new SearchService();
      mockDb.pG.findMany.mockResolvedValue([
        { name: 'RoomBae Indiranagar Luxe', location: { locality: 'Indiranagar', city: 'Bengaluru' } },
      ]);

      const suggestions = await searchService.getAutocomplete('Indira');
      expect(suggestions).toContain('RoomBae Indiranagar Luxe');
      expect(suggestions).toContain('Indiranagar');
    });
  });

  describe('6. Subscriptions & Owner Property Batch API Contracts', () => {
    it('should cancel owner subscription', async () => {
      const subService = new SubscriptionService();
      const mockSub = { id: 'sub_1', ownerId: 'owner_1', plan: { name: 'Growth', pgLimit: 5 } };
      mockDb.subscription.findFirst.mockResolvedValue(mockSub);
      mockDb.subscription.update.mockResolvedValue({ ...mockSub, status: 'CANCELLED' });

      const res = await subService.cancelSubscription('owner_1');
      expect(res.status).toBe('CANCELLED');
    });

    it('should add buildings and batch create rooms for owner property', async () => {
      const ownerService = new OwnerService();
      mockDb.pG.findUnique.mockResolvedValue({ id: 'pg_1' });
      mockDb.floor.findMany.mockResolvedValue([{ id: 'flr_1', floorNumber: 1 }]);
      mockDb.room.create.mockResolvedValue({ id: 'room_1' });
      mockDb.bed.create.mockResolvedValue({ id: 'bed_1' });

      const bldgRes = await ownerService.addBuilding('pg_1', 'owner_1', { buildingName: 'Tower A', floorsCount: 2 });
      expect(bldgRes.success).toBe(true);

      const batchRes = await ownerService.batchCreateRooms('pg_1', 'owner_1', {
        roomsPerFloor: 2,
        roomType: 'DOUBLE',
        customCapacity: 2,
        rentAmount: 8500,
      });
      expect(batchRes.success).toBe(true);
      expect(mockDb.room.create).toHaveBeenCalled();
      expect(mockDb.bed.create).toHaveBeenCalled();
    });
  });
});
