const fs = require('fs');
const path = require('path');

const backendSrc = path.join(__dirname, '..', 'backend', 'src');
const frontendDir = path.join(__dirname, '..', 'frontend', 'src');

// 1. Mount points from apiRouter.ts
const apiRouterContent = fs.readFileSync(path.join(backendSrc, 'routes', 'apiRouter.ts'), 'utf-8');
const mountRegex = /apiRouter\.use\(['"]([^'"]+)['"],\s*([a-zA-Z0-9_]+)\)/g;
const mountMap = {};
let match;
while ((match = mountRegex.exec(apiRouterContent)) !== null) {
  const prefix = match[1];
  const routerName = match[2];
  if (!mountMap[routerName]) mountMap[routerName] = [];
  mountMap[routerName].push(prefix);
}

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

const backendRoutes = [];

for (const rf of routeFiles) {
  const fullFilePath = path.join(backendSrc, rf.file);
  if (!fs.existsSync(fullFilePath)) continue;
  const content = fs.readFileSync(fullFilePath, 'utf-8');
  const prefixes = mountMap[rf.name] || [''];
  
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let rm;
  while ((rm = routeRegex.exec(content)) !== null) {
    const method = rm[1].toUpperCase();
    const subPath = rm[2];
    
    for (const prefix of prefixes) {
      const joinedPath = (prefix === '/' ? '' : prefix) + (subPath === '/' ? '' : subPath.startsWith('/') ? subPath : '/' + subPath);
      const normPath = joinedPath === '' ? '/' : joinedPath;
      backendRoutes.push({
        method,
        fullPath: normPath,
        module: rf.name,
        file: rf.file,
      });
    }
  }
}

// 2. Frontend Calls
const frontendCalls = [];

function scanFrontend(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '__tests__'].includes(entry.name)) {
        scanFrontend(full);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const apiMatch = line.match(/(?:apiClient|api|httpClient)\.(get|post|put|patch|delete)\s*(?:<[^>]+>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/);
        if (apiMatch) {
          frontendCalls.push({
            method: apiMatch[1].toUpperCase(),
            path: apiMatch[2],
            file: path.relative(frontendDir, full),
            line: i + 1,
          });
        }
      }
    }
  }
}

scanFrontend(frontendDir);

// Compare
function matchRoute(fePath, feMethod, beRoute) {
  if (feMethod !== beRoute.method) return false;

  const feClean = fePath.split('?')[0].replace(/\$\{[^}]+\}/g, '__PARAM__');
  const feSegments = feClean.split('/').filter(Boolean);
  const beSegments = beRoute.fullPath.split('/').filter(Boolean);

  if (feSegments.length !== beSegments.length) return false;

  for (let i = 0; i < feSegments.length; i++) {
    const feSeg = feSegments[i];
    const beSeg = beSegments[i];

    if (beSeg.startsWith(':') || feSeg === '__PARAM__') continue;
    if (feSeg !== beSeg) return false;
  }
  return true;
}

const uncalledBackendRoutes = [];
for (const be of backendRoutes) {
  const matched = frontendCalls.some(fe => matchRoute(fe.path, fe.method, be));
  if (!matched) {
    uncalledBackendRoutes.push(be);
  }
}

console.log(`\n========================================`);
console.log(`TOTAL BACKEND ROUTES: ${backendRoutes.length}`);
console.log(`TOTAL FRONTEND API CALLS: ${frontendCalls.length}`);
console.log(`BACKEND ROUTES WITH DIRECT FRONTEND CALLS: ${backendRoutes.length - uncalledBackendRoutes.length}`);
console.log(`BACKEND ROUTES WITHOUT FRONTEND CALL: ${uncalledBackendRoutes.length}`);
console.log(`========================================\n`);

// Group uncalled by module
const byModule = {};
for (const r of uncalledBackendRoutes) {
  if (!byModule[r.module]) byModule[r.module] = [];
  byModule[r.module].push(`${r.method} ${r.fullPath}`);
}

for (const [mod, routes] of Object.entries(byModule)) {
  console.log(`### ${mod} (${routes.length} uncalled routes):`);
  routes.forEach(r => console.log(`  - ${r}`));
  console.log();
}
