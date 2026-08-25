import * as fs from 'fs';
import * as path from 'path';

const backendSrc = path.join(__dirname, '..', 'backend', 'src');
const frontendSrc = path.join(__dirname, '..', 'frontend', 'src');

// 1. Mount points from apiRouter.ts
const apiRouterContent = fs.readFileSync(path.join(backendSrc, 'routes', 'apiRouter.ts'), 'utf-8');
const mountRegex = /apiRouter\.use\(['"]([^'"]+)['"],\s*([a-zA-Z0-9_]+)\)/g;
const mountMap: Record<string, string[]> = {};
let match;
while ((match = mountRegex.exec(apiRouterContent)) !== null) {
  const prefix = match[1];
  const routerName = match[2];
  if (!mountMap[routerName]) mountMap[routerName] = [];
  mountMap[routerName].push(prefix);
}

console.log('Mount Map from apiRouter.ts:', mountMap);

// Map router variable name to its file
const routeFiles = [
  { name: 'authRoutes', file: 'modules/auth/auth.routes.ts' },
  { name: 'subscriptionRoutes', file: 'modules/subscriptions/subscription.routes.ts' },
  { name: 'propertyRoutes', file: 'modules/properties/property.routes.ts' },
  { name: 'roomRoutes', file: 'modules/rooms/room.routes.ts' },
  { name: 'bedRoutes', file: 'modules/beds/bed.routes.ts' },
  { name: 'searchRoutes', file: 'modules/search/search.routes.ts' },
  { name: 'bookingRoutes', file: 'modules/bookings/booking.routes.ts' },
  { name: 'billingRoutes', file: 'modules/billing/billing.routes.ts' },
  { name: 'paymentRoutes', file: 'modules/payments/payment.routes.ts' },
  { name: 'agreementRoutes', file: 'modules/agreements/agreement.routes.ts' },
  { name: 'complaintRoutes', file: 'modules/complaints/complaint.routes.ts' },
  { name: 'moveInRoutes', file: 'modules/moveIn/moveIn.routes.ts' },
  { name: 'notificationRoutes', file: 'modules/notifications/notification.routes.ts' },
  { name: 'analyticsRoutes', file: 'modules/analytics/analytics.routes.ts' },
  { name: 'adminRoutes', file: 'modules/admin/admin.routes.ts' },
  { name: 'dashboardRoutes', file: 'modules/dashboard/dashboard.routes.ts' },
  { name: 'residentRoutes', file: 'modules/residents/resident.routes.ts' },
  { name: 'ownerRoutes', file: 'modules/owners/owner.routes.ts' },
  { name: 'documentRoutes', file: 'modules/documents/document.routes.ts' },
  { name: 'uploadRoutes', file: 'routes/upload.routes.ts' },
];

interface BackendRoute {
  method: string;
  fullPath: string;
  subPath: string;
  order: number;
  handler: string;
  middlewares: string[];
  file: string;
}

const backendRoutes: BackendRoute[] = [];

for (const rf of routeFiles) {
  const fullPath = path.join(backendSrc, rf.file);
  if (!fs.existsSync(fullPath)) {
    console.warn('File does not exist:', fullPath);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const prefixes = mountMap[rf.name] || [''];
  
  const lines = content.split('\n');
  let order = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // match router.get/post/put/patch/delete('...', ...)
    const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*(.+)\);?/;
    const m = line.match(routeRegex);
    if (m) {
      order++;
      const method = m[1].toUpperCase();
      const subPath = m[2];
      const rest = m[3].split(',').map(s => s.trim());
      const handler = rest[rest.length - 1];
      const middlewares = rest.slice(0, -1);
      
      for (const prefix of prefixes) {
        const joinedPath = (prefix === '/' ? '' : prefix) + (subPath === '/' ? '' : subPath.startsWith('/') ? subPath : '/' + subPath);
        backendRoutes.push({
          method,
          fullPath: joinedPath === '' ? '/' : joinedPath,
          subPath,
          order,
          handler,
          middlewares,
          file: rf.file
        });
      }
    }
  }
}

console.log(`Extracted ${backendRoutes.length} backend routes.`);
fs.writeFileSync(path.join(__dirname, 'backend-routes.json'), JSON.stringify(backendRoutes, null, 2));
