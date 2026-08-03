import { PrismaClient } from '@prisma/client';

export class SearchService {
  constructor(private readonly prisma: PrismaClient) {}

  async globalSearch(query: string, pgId?: string): Promise<any> {
    if (!query || query.trim().length === 0) {
      return { residents: [], rooms: [], beds: [], complaints: [], invoices: [], pgs: [] };
    }

    const term = query.trim();

    const [residents, rooms, beds, complaints, invoices, pgs] = await Promise.all([
      this.prisma.resident.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { occupation: { contains: term, mode: 'insensitive' } }
          ],
          ...(pgId ? { pgId } : {})
        },
        take: 10,
        include: { bed: true, pg: true }
      }),
      this.prisma.room.findMany({
        where: {
          roomNumber: { contains: term, mode: 'insensitive' }
        },
        take: 10,
        include: { beds: true, floor: true }
      }),
      this.prisma.bed.findMany({
        where: {
          bedNumber: { contains: term, mode: 'insensitive' }
        },
        take: 10,
        include: { room: true, resident: true }
      }),
      this.prisma.complaint.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { ticketCode: { contains: term, mode: 'insensitive' } }
          ],
          ...(pgId ? { pgId } : {})
        },
        take: 10,
        include: { resident: true }
      }),
      this.prisma.invoice.findMany({
        where: {
          invoiceNumber: { contains: term, mode: 'insensitive' }
        },
        take: 10,
        include: { resident: true }
      }),
      this.prisma.pG.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { city: { contains: term, mode: 'insensitive' } },
            { address: { contains: term, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    ]);

    return {
      query: term,
      resultsCount: residents.length + rooms.length + beds.length + complaints.length + invoices.length + pgs.length,
      residents,
      rooms,
      beds,
      complaints,
      invoices,
      pgs
    };
  }
}
