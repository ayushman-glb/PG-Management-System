import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { subscriptionRoutes } from '../modules/subscriptions';
import { propertyRoutes } from '../modules/properties';
import { roomRoutes } from '../modules/rooms';
import { bedRoutes } from '../modules/beds';
import { searchRoutes } from '../modules/search';
import { bookingRoutes } from '../modules/bookings';
import { billingRoutes } from '../modules/billing';
import { paymentRoutes } from '../modules/payments';
import { agreementRoutes } from '../modules/agreements';
import { complaintRoutes } from '../modules/complaints';
import { moveInRoutes } from '../modules/moveIn';
import { notificationRoutes } from '../modules/notifications';
import { analyticsRoutes } from '../modules/analytics';
import { adminRoutes } from '../modules/admin';
import { dashboardRoutes } from '../modules/dashboard';
import { residentRoutes } from '../modules/residents';
import { ownerRoutes } from '../modules/owners';
import { documentRoutes } from '../modules/documents';
import { uploadRoutes } from './upload.routes';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

const apiRouter = Router();

/**
 * Root Service Discovery & API Catalog Endpoint
 */
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'RoomBae REST API v1',
    description: 'Enterprise PG Management & Coliving Discovery Platform REST API',
    status: 'Running',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      auth: '/api/v1/auth',
      dashboard: '/api/v1/dashboard',
      residents: '/api/v1/residents',
      owners: '/api/v1/owners',
      subscriptions: '/api/v1/subscriptions',
      pgs: '/api/v1/pgs',
      properties: '/api/v1/properties',
      rooms: '/api/v1/rooms',
      beds: '/api/v1/beds',
      search: '/api/v1/search',
      bookings: '/api/v1/bookings',
      billing: '/api/v1/billing',
      payments: '/api/v1/payments',
      agreements: '/api/v1/agreements',
      documents: '/api/v1/documents',
      complaints: '/api/v1/complaints',
      moveIn: '/api/v1/move-in',
      notifications: '/api/v1/notifications',
      analytics: '/api/v1/analytics',
      admin: '/api/v1/admin',
      health: '/api/v1/health',
    },
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await (prisma as any).$runCommandRaw({ ping: 1 });
    dbLatency = Date.now() - dbStart;
    dbStatus = 'CONNECTED';
  } catch (error) {
    dbStatus = 'DISCONNECTED';
  }

  const isHealthy = dbStatus === 'CONNECTED';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    service: 'RoomBae REST API v1',
    environment: env.NODE_ENV,
    latencyMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
    },
    timestamp: new Date().toISOString(),
  });
});

// Domain Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/residents', residentRoutes);
apiRouter.use('/owners', ownerRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/pgs', propertyRoutes);
apiRouter.use('/properties', propertyRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/beds', bedRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/agreements', agreementRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/move-in', moveInRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/uploads', uploadRoutes);

export default apiRouter;
