import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createPropertyLoader(prisma: PrismaClient) {
  return new DataLoader(async (keys: readonly string[]) => {
    const properties = await prisma.pG.findMany({
      where: { id: { in: [...keys] } }
    });
    const propertyMap = new Map(properties.map(p => [p.id, p]));
    return keys.map(key => propertyMap.get(key) || null);
  });
}
