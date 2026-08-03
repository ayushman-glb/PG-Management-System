import { GraphQLContext } from '../context';
import { Container } from '../../container';

export const queryResolvers = {

  owners: async (_: any, __: any, ctx: GraphQLContext) => {
    return ctx.prisma.owner.findMany({ include: { pgs: true } });
  },
  owner: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    return ctx.prisma.owner.findUnique({ where: { id: args.id }, include: { pgs: true } });
  },
  pgs: async (_: any, args: { city?: string; status?: any }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.city) where.city = { contains: args.city, mode: 'insensitive' };
    if (args.status) where.status = args.status;
    return ctx.prisma.pG.findMany({ where, include: { residents: true } });
  },
  pg: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    return ctx.prisma.pG.findUnique({
      where: { id: args.id },
      include: { residents: true, mealSchedules: true, complaints: true }
    });
  },
  residents: async (_: any, args: { pgId?: string; status?: any; search?: string }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.pgId) where.pgId = args.pgId;
    if (args.status) where.status = args.status;
    if (args.search) {
      where.OR = [
        { name: { contains: args.search, mode: 'insensitive' } },
        { email: { contains: args.search, mode: 'insensitive' } },
        { phone: { contains: args.search, mode: 'insensitive' } }
      ];
    }
    return ctx.prisma.resident.findMany({ where, orderBy: { createdAt: 'desc' } });
  },
  resident: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    return ctx.loaders.residentLoader.load(args.id);
  },
  agreements: async (_: any, args: { residentId?: string; ownerId?: string }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.residentId) where.residentId = args.residentId;
    if (args.ownerId) where.ownerId = args.ownerId;
    return ctx.prisma.agreement.findMany({ where, include: { signatures: true }, orderBy: { createdAt: 'desc' } });
  },
  agreement: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    return ctx.prisma.agreement.findUnique({ where: { id: args.id }, include: { signatures: true } });
  },
  complaints: async (_: any, args: { pgId?: string; status?: any; priority?: any }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.pgId) where.pgId = args.pgId;
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;
    return ctx.prisma.complaint.findMany({ where, orderBy: { createdAt: 'desc' } });
  },
  mealSchedules: async (_: any, args: { pgId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.mealSchedule.findMany({ where: { pgId: args.pgId } });
  },
  payments: async (_: any, args: { pgId?: string; status?: string }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.pgId) where.pgId = args.pgId;
    if (args.status) where.status = args.status as any;
    return ctx.prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
  },
  ownerMetrics: async (_: any, args: { ownerId: string }, ctx: GraphQLContext) => {
    const pgs = await ctx.prisma.pG.findMany({ where: { ownerId: args.ownerId } });
    const pgIds = pgs.map(p => p.id);

    const totalBeds = pgs.reduce((acc, p) => acc + p.capacity, 0);
    const occupiedBeds = pgs.reduce((acc, p) => acc + p.currentOccupancy, 0);
    const occupancyRatePercent = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Real MRR: sum of PAID payments this calendar month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const paidPayments = await ctx.prisma.payment.findMany({
      where: { pgId: { in: pgIds }, status: 'PAID', paymentDate: { gte: startOfMonth } },
      select: { totalAmount: true }
    });
    const mrr = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    // Real active complaints count
    const activeComplaints = await ctx.prisma.complaint.count({
      where: { pgId: { in: pgIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    // Real pending dues: sum of PENDING payments
    const pendingPayments = await ctx.prisma.payment.findMany({
      where: { pgId: { in: pgIds }, status: 'PENDING' },
      select: { totalAmount: true }
    });
    const pendingDuesAmount = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      totalProperties: pgs.length,
      mrr: parseFloat(mrr.toFixed(2)),
      totalBeds,
      occupiedBeds,
      occupancyRatePercent: Number(occupancyRatePercent.toFixed(1)),
      activeComplaints,
      pendingDuesAmount: parseFloat(pendingDuesAmount.toFixed(2))
    };
  },
  roomTransferRequests: async (_: any, args: { pgId?: string; residentId?: string }, ctx: GraphQLContext) => {
    const where: any = {};
    if (args.pgId) where.pgId = args.pgId;
    if (args.residentId) where.residentId = args.residentId;
    return ctx.prisma.roomTransferRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  },
  bedHolds: async (_: any, args: { pgId?: string }, ctx: GraphQLContext) => {
    return ctx.prisma.bedHold.findMany({
      where: {
        isActive: true,
        ...(args.pgId ? { bed: { room: { floor: { building: { pgId: args.pgId } } } } } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  residentStatusHistory: async (_: any, args: { residentId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.residentStatusHistory.findMany({
      where: { residentId: args.residentId },
      orderBy: { createdAt: 'desc' }
    });
  },
  auditLogs: async (_: any, args: { limit?: number }, ctx: GraphQLContext) => {
    return Container.residentManagementService.getAuditLogs(ctx.user?.role || 'OWNER', args.limit || 50);
  },
  notifications: async (_: any, args: { userId: string }, ctx: GraphQLContext) => {
    return Container.residentManagementService.getNotifications(args.userId);
  },
  globalSearch: async (_: any, args: { query: string; pgId?: string }, ctx: GraphQLContext) => {
    const term = args.query.trim();
    if (!term) return { query: '', resultsCount: 0, residents: [], rooms: [], beds: [], complaints: [], invoices: [], pgs: [] };

    const [residents, rooms, beds, complaints, invoices, pgs] = await Promise.all([
      ctx.prisma.resident.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } }
          ],
          ...(args.pgId ? { pgId: args.pgId } : {})
        },
        take: 10
      }),
      ctx.prisma.room.findMany({
        where: { roomNumber: { contains: term, mode: 'insensitive' } },
        take: 10
      }),
      ctx.prisma.bed.findMany({
        where: { bedNumber: { contains: term, mode: 'insensitive' } },
        take: 10
      }),
      ctx.prisma.complaint.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { ticketCode: { contains: term, mode: 'insensitive' } }
          ],

          ...(args.pgId ? { pgId: args.pgId } : {})
        },
        take: 10
      }),
      ctx.prisma.invoice.findMany({
        where: { invoiceNumber: { contains: term, mode: 'insensitive' } },
        take: 10
      }),
      ctx.prisma.pG.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
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
  },
  fineRules: async (_: any, args: { pgId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.fineRule.findMany({ where: { pgId: args.pgId, isActive: true } });
  },
  residentFines: async (_: any, args: { residentId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.fine.findMany({ where: { residentId: args.residentId }, orderBy: { createdAt: 'desc' } });
  },
  me: async (_: any, args: { userId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.user.findUnique({ where: { id: args.userId } });
  },
  ownerProfile: async (_: any, args: { userId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.owner.findUnique({ where: { userId: args.userId }, include: { pgs: true } });
  },
  residentProfile: async (_: any, args: { userId: string }, ctx: GraphQLContext) => {
    return ctx.prisma.resident.findUnique({ where: { userId: args.userId }, include: { pg: true, bed: true } });
  }
};




