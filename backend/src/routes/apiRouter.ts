import { Router } from 'express';
import { tenantMiddleware } from '../core/middleware/tenantMiddleware';
import { authRoutes } from '../modules/auth';
import { ownerRoutes } from '../modules/owners';
import { propertyRoutes } from '../modules/properties';
import { roomRoutes } from '../modules/rooms';
import { bedRoutes } from '../modules/beds';
import { residentRoutes } from '../modules/residents';
import { billingRoutes } from '../modules/billing';
import { complaintRoutes } from '../modules/complaints';
import { agreementRoutes } from '../modules/agreements';
import { searchRoutes } from '../modules/search';
import { analyticsRoutes } from '../modules/analytics';
import { notificationRoutes } from '../modules/notifications';
import { settingsRoutes } from '../modules/settings';
import uploadRoutes from './upload.routes';
import mediaRoutes from './media.routes';
import { dashboardRoutes } from './dashboard.routes';
import { documentRoutes } from '../modules/documents';
import { toursRoutes } from '../modules/tours';
import { applicationsRoutes } from '../modules/applications';
import { messagesRoutes } from '../modules/messages';
import { moveInRoutes } from '../modules/moveIn';
import { deviceRoutes } from '../modules/devices';
import { marketingRoutes } from '../modules/marketing';
import { paymentRoutes } from '../modules/payments';
import { godRoutes } from '../modules/god';
import { env } from '../config/env';

const apiRouter = Router();

apiRouter.use(tenantMiddleware);

/**
 * Root REST API v1 Service Discovery & Catalog Endpoint
 * Handles GET /api/v1 and GET /api/v1/
 */
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'RoomBae REST API v1',
    description: 'Enterprise PG & Co-living Facility Management Platform REST API',
    status: 'Running',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      auth: '/api/v1/auth',
      properties: '/api/v1/properties',
      rooms: '/api/v1/rooms',
      beds: '/api/v1/beds',
      residents: '/api/v1/residents',
      billing: '/api/v1/billing',
      payments: '/api/v1/payments',
      devices: '/api/v1/security/devices',
      complaints: '/api/v1/complaints',
      agreements: '/api/v1/agreements',
      analytics: '/api/v1/analytics',
      notifications: '/api/v1/notifications',
      settings: '/api/v1/settings',
      documents: '/api/v1/documents',
      tours: '/api/v1/tours',
      applications: '/api/v1/applications',
      messages: '/api/v1/messages',
      moveIn: '/api/v1/move-in',
      health: '/api/v1/health',
      pipelineHealth: '/api/v1/health/pipeline-test',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * API v1 Health Probe Endpoint
 * Handles GET /api/v1/health
 */
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'HEALTHY',
    service: 'RoomBae REST API v1',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Middleware Pipeline Health & Self-Diagnostic Endpoint
apiRouter.get('/health/pipeline-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Full middleware pipeline operational',
    data: {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      correlationId: (req.headers['x-correlation-id'] as string) || (res.getHeader('x-correlation-id') as string) || 'none',
      ip: req.ip,
    },
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/security/devices', deviceRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/onboarding', ownerRoutes);
apiRouter.use('/owners', ownerRoutes);
apiRouter.use('/properties', propertyRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/beds', bedRoutes);
apiRouter.use('/residents', residentRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/support', complaintRoutes);
apiRouter.use('/marketing', marketingRoutes);
apiRouter.use('/agreements', agreementRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/tours', toursRoutes);
apiRouter.use('/shortlist', toursRoutes);
apiRouter.use('/applications', applicationsRoutes);
apiRouter.use('/messages', messagesRoutes);
apiRouter.use('/move-in', moveInRoutes);
apiRouter.use('/god', godRoutes);

export default apiRouter;
