import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createResidentLoader(prisma: PrismaClient) {
  return new DataLoader(async (keys: readonly string[]) => {
    const residents = await prisma.resident.findMany({
      where: { id: { in: [...keys] } }
    });
    const residentMap = new Map(residents.map(r => [r.id, r]));
    return keys.map(key => residentMap.get(key) || null);
  });
}
