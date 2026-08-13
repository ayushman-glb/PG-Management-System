import { PrismaPropertyRepository } from '../../repositories/PrismaPropertyRepository';
import { ResidentManagementRepository } from '../../repositories/ResidentManagementRepository';

describe('Phase 1 Database Layer Defect Sweep Unit Tests', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      pG: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'pg_1', name: 'Executive PG Bengaluru', city: 'Bengaluru' }
        ]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      building: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bldg_1', pgId: 'pg_1' }),
        create: jest.fn(),
      },
      floor: {
        findFirst: jest.fn().mockResolvedValue({ id: 'flr_1', buildingId: 'bldg_1' }),
        create: jest.fn(),
      },
      room: {
        create: jest.fn().mockResolvedValue({ id: 'room_1', roomNumber: '101', floorId: 'flr_1' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      bed: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: `bed_${Math.random()}`, ...data })),
        delete: jest.fn().mockImplementation(({ where }) => ({ id: where.id })),
      },
      activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'log_1' }),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };
  });

  describe('PrismaPropertyRepository Defect Fixes', () => {
    test('search() query uses standard MongoDB contains filter without unsupported mode: insensitive', async () => {
      const repo = new PrismaPropertyRepository(mockPrisma);
      const result = await repo.search({ city: 'Bengaluru', page: 1, limit: 10 });

      expect(result.properties.length).toBe(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.pG.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { city: { contains: 'Bengaluru' } }
        })
      );
    });

    test('createRoomWithBeds() batches bed creation inside a single $transaction', async () => {
      const repo = new PrismaPropertyRepository(mockPrisma);
      const room = await repo.createRoomWithBeds('pg_1', '101', 2);

      expect(room.id).toBe('room_1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionCall = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionCall.length).toBe(2);
    });
  });

  describe('ResidentManagementRepository Defect Fixes', () => {
    test('convertRoomType() atomically executes bed additions in a single $transaction', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room_101',
        roomNumber: '101',
        beds: [{ id: 'bed_1', bedNumber: '101-A', isOccupied: false }],
        floor: { building: { pg: { id: 'pg_1' } } }
      });
      mockPrisma.room.update.mockResolvedValue({
        id: 'room_101',
        roomType: 'TRIPLE',
        beds: [
          { id: 'bed_1', bedNumber: '101-A' },
          { id: 'bed_2', bedNumber: '101-B' },
          { id: 'bed_3', bedNumber: '101-C' }
        ]
      });

      const repo = new ResidentManagementRepository(mockPrisma);
      await repo.convertRoomType('room_101', 'TRIPLE', 'user_admin');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const ops = mockPrisma.$transaction.mock.calls[0][0];
      expect(ops.length).toBe(2); // 2 new beds added for SINGLE -> TRIPLE conversion
    });

    test('convertRoomType() atomically deletes unoccupied beds via $transaction', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room_102',
        roomNumber: '102',
        beds: [
          { id: 'bed_1', bedNumber: '102-A', isOccupied: true },
          { id: 'bed_2', bedNumber: '102-B', isOccupied: false },
          { id: 'bed_3', bedNumber: '102-C', isOccupied: false }
        ],
        floor: { building: { pg: { id: 'pg_1' } } }
      });
      mockPrisma.room.update.mockResolvedValue({
        id: 'room_102',
        roomType: 'SINGLE',
        beds: [{ id: 'bed_1', bedNumber: '102-A' }]
      });

      const repo = new ResidentManagementRepository(mockPrisma);
      await repo.convertRoomType('room_102', 'SINGLE', 'user_admin');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const ops = mockPrisma.$transaction.mock.calls[0][0];
      expect(ops.length).toBe(2); // 2 unoccupied beds removed for TRIPLE -> SINGLE conversion
    });
  });
});
