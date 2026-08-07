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
import residentManagementRoutes from './residentManagementRoutes';
import saasManagementRoutes from './saasManagementRoutes';
import uploadRoutes from './upload.routes';
import mediaRoutes from './media.routes';
import { dashboardRoutes } from './dashboard.routes';
import { documentRoutes } from '../modules/documents';

const apiRouter = Router();

apiRouter.use(tenantMiddleware);

apiRouter.use('/auth', authRoutes);
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
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/agreements', agreementRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/resident-management', residentManagementRoutes);
apiRouter.use('/saas', saasManagementRoutes);
apiRouter.use('/documents', documentRoutes);

export default apiRouter;
