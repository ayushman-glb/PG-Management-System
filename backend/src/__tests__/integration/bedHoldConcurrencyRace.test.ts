import { BedService } from '../../modules/beds/bed.service';
import { BedStatus } from '@prisma/client';

describe('Bed-Hold Concurrency & Mutex Lock Race Condition Integration', () => {
  let bedService: BedService;

  it('1. should prevent double-booking under near-simultaneous concurrent hold attempts on the same bed', async () => {
    const testBedId = '64a000000000000000000030';
    let isOccupied = false;
    let bedStatus: BedStatus = BedStatus.AVAILABLE;
    let holdsCreated = 0;

    const mockDb: any = {
      bed: {
        findUnique: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            id: testBedId,
            isOccupied,
            status: bedStatus,
          });
        }),
        update: jest.fn().mockImplementation(() => {
          const holdStatus = (BedStatus as any).HOLD || BedStatus.RESERVED;
          if (bedStatus === holdStatus || isOccupied) {
            throw new Error('Optimistic concurrency violation: Bed already on HOLD');
          }
          bedStatus = holdStatus;
          return Promise.resolve({ id: testBedId, status: bedStatus });
        }),
      },
      bedHold: {
        create: jest.fn().mockImplementation((args: any) => {
          holdsCreated++;
          return Promise.resolve({ id: `hold_${holdsCreated}`, ...args.data });
        }),
      },
    };

    bedService = new BedService(mockDb);

    // Fire 2 concurrent hold attempts
    const attempt1 = bedService.createBedHold({
      bedId: testBedId,
      reason: 'MAINTENANCE',
      notes: 'Attempt 1',
    });

    const attempt2 = bedService.createBedHold({
      bedId: testBedId,
      reason: 'MAINTENANCE',
      notes: 'Attempt 2',
    });

    const results = await Promise.allSettled([attempt1, attempt2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 hold must succeed, and the second must be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(holdsCreated).toBe(1);
  });
});
