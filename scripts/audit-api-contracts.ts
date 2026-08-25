import * as fs from 'fs';
import * as path from 'path';

interface BackendRoute {
  method: string;
  fullPath: string;
  subPath: string;
  order: number;
  handler: string;
  middlewares: string[];
  file: string;
  normalizedSegments: string[];
}

interface FrontendCall {
  file: string;
  functionName: string;
  method: string;
  endpointTemplate: string;
  line: number;
  rawCall: string;
  cleanPath: string;
  normalizedSegments: string[];
}

const backendSrc = path.join(__dirname, '..', 'backend', 'src');
const frontendServicesDir = path.join(__dirname, '..', 'frontend', 'src', 'services');

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

const backendRoutes: BackendRoute[] = [];

for (const rf of routeFiles) {
  const fullFilePath = path.join(backendSrc, rf.file);
  if (!fs.existsSync(fullFilePath)) continue;
  const content = fs.readFileSync(fullFilePath, 'utf-8');
  const prefixes = mountMap[rf.name] || [''];
  
  const lines = content.split('\n');
  let order = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
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
        const normPath = joinedPath === '' ? '/' : joinedPath;
        const normalizedSegments = normPath.split('/').filter(Boolean);
        backendRoutes.push({
          method,
          fullPath: normPath,
          subPath,
          order,
          handler,
          middlewares,
          file: rf.file,
          normalizedSegments
        });
      }
    }
  }
}

// Extract frontend calls from services + features/components
const frontendCalls: FrontendCall[] = [];

function scanFrontendDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '__tests__'].includes(entry.name)) {
        scanFrontendDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      let currentFunction = 'top-level';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fnMatch = line.match(/(?:async\s+)?([a-zA-Z0-9_$]+)\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>|\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)/);
        if (fnMatch && !line.includes('if ') && !line.includes('switch ') && !line.includes('for ') && !line.includes('catch ')) {
          currentFunction = fnMatch[1];
        }

        // Match api.get, api.post, etc. or api.request
        const apiRegexes = [
          /api\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*([`'"][^`'"]+[`'"])/g,
          /api\.request\s*(?:<[^>]*>)?\s*\(\s*([`'"][^`'"]+[`'"])/g,
        ];

        for (const regex of apiRegexes) {
          let m: RegExpExecArray | null;
          while ((m = regex.exec(line)) !== null) {
            let method = m[1] ? m[1].toUpperCase() : 'GET';
            let rawEndpoint = m[m.length - 1].slice(1, -1);

            if (method === 'REQUEST') {
              const methodMatch = line.match(/method:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/i);
              method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
            }

            // Clean query params or string interpolations from template
            let cleanPath = rawEndpoint.split('?')[0];
            cleanPath = cleanPath.replace(/\$\{[^}]+\}/g, ':param');
            cleanPath = cleanPath.replace(/\{[a-zA-Z0-9_]+\}/g, ':param');

            const normalizedSegments = cleanPath.split('/').filter(Boolean);

            frontendCalls.push({
              file: path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/'),
              functionName: currentFunction,
              method,
              endpointTemplate: rawEndpoint,
              cleanPath: cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath,
              line: i + 1,
              rawCall: line.trim(),
              normalizedSegments
            });
          }
        }
      }
    }
  }
}

scanFrontendDir(path.join(__dirname, '..', 'frontend', 'src'));

console.log(`Auditing ${frontendCalls.length} frontend calls against ${backendRoutes.length} backend routes...\n`);

interface AuditResult {
  frontendCall: string;
  method: string;
  file: string;
  line: number;
  matchedBackendRoute?: BackendRoute;
  status: 'OK' | 'MISSING_ROUTE' | 'METHOD_MISMATCH' | 'ROUTE_ORDERING_TRAP';
  details?: string;
}

const auditResults: AuditResult[] = [];

for (const fc of frontendCalls) {
  if (fc.cleanPath.startsWith('/auth/csrf-token')) continue; // internal token call handled by client

  // Find routes matching path pattern
  const candidateRoutes = backendRoutes.filter(br => {
    if (br.normalizedSegments.length !== fc.normalizedSegments.length) return false;
    for (let i = 0; i < br.normalizedSegments.length; i++) {
      const brSeg = br.normalizedSegments[i];
      const fcSeg = fc.normalizedSegments[i];
      if (brSeg.startsWith(':')) continue; // wildcard param
      if (fcSeg === ':param') continue; // dynamic param in frontend
      if (brSeg !== fcSeg) return false;
    }
    return true;
  });

  if (candidateRoutes.length === 0) {
    // Check if method exists on a different path or path with different method
    const anyMethodRoutes = backendRoutes.filter(br => {
      if (br.normalizedSegments.length !== fc.normalizedSegments.length) return false;
      for (let i = 0; i < br.normalizedSegments.length; i++) {
        const brSeg = br.normalizedSegments[i];
        const fcSeg = fc.normalizedSegments[i];
        if (brSeg.startsWith(':')) continue;
        if (fcSeg === ':param') continue;
        if (brSeg !== fcSeg) return false;
      }
      return true;
    });

    if (anyMethodRoutes.length > 0) {
      auditResults.push({
        frontendCall: fc.cleanPath,
        method: fc.method,
        file: fc.file,
        line: fc.line,
        status: 'METHOD_MISMATCH',
        details: `Expected ${fc.method}, backend has ${anyMethodRoutes.map(r => r.method).join(', ')} on ${anyMethodRoutes[0].fullPath}`
      });
    } else {
      auditResults.push({
        frontendCall: fc.cleanPath,
        method: fc.method,
        file: fc.file,
        line: fc.line,
        status: 'MISSING_ROUTE',
        details: `No route matching path ${fc.cleanPath} on backend`
      });
    }
    continue;
  }

  // Candidate routes with same method
  const exactMethodCandidates = candidateRoutes.filter(r => r.method === fc.method);

  if (exactMethodCandidates.length === 0) {
    auditResults.push({
      frontendCall: fc.cleanPath,
      method: fc.method,
      file: fc.file,
      line: fc.line,
      status: 'METHOD_MISMATCH',
      details: `Backend supports [${candidateRoutes.map(r => r.method).join(', ')}] on ${candidateRoutes[0].fullPath}, frontend calls ${fc.method}`
    });
    continue;
  }

  // Check route ordering trap: if the frontend call is a literal segment (not dynamic param),
  // but a dynamic segment route in the same router file was defined BEFORE the matching literal route
  const targetRoute = exactMethodCandidates[0];
  
  // Find all routes in the SAME file and SAME prefix that match the pattern
  const routerFileRoutes = backendRoutes.filter(br => br.file === targetRoute.file && br.method === targetRoute.method);
  
  let routeOrderingTrap = false;
  let trappingRoute: BackendRoute | undefined;

  for (const rfr of routerFileRoutes) {
    if (rfr.order < targetRoute.order) {
      // Check if rfr would match this frontend call before targetRoute
      const rfrSegs = rfr.normalizedSegments;
      if (rfrSegs.length === fc.normalizedSegments.length) {
        let matches = true;
        for (let i = 0; i < rfrSegs.length; i++) {
          if (rfrSegs[i].startsWith(':')) continue;
          if (fc.normalizedSegments[i] === ':param') continue;
          if (rfrSegs[i] !== fc.normalizedSegments[i]) {
            matches = false;
            break;
          }
        }
        if (matches && rfr.fullPath !== targetRoute.fullPath) {
          routeOrderingTrap = true;
          trappingRoute = rfr;
          break;
        }
      }
    }
  }

  if (routeOrderingTrap && trappingRoute) {
    auditResults.push({
      frontendCall: fc.cleanPath,
      method: fc.method,
      file: fc.file,
      line: fc.line,
      matchedBackendRoute: targetRoute,
      status: 'ROUTE_ORDERING_TRAP',
      details: `Route ${targetRoute.subPath} (order ${targetRoute.order}) is shadowed by dynamic route ${trappingRoute.subPath} (order ${trappingRoute.order}) in ${targetRoute.file}`
    });
  } else {
    auditResults.push({
      frontendCall: fc.cleanPath,
      method: fc.method,
      file: fc.file,
      line: fc.line,
      matchedBackendRoute: targetRoute,
      status: 'OK'
    });
  }
}

const issues = auditResults.filter(r => r.status !== 'OK');
console.log(`Audit finished. Total calls: ${auditResults.length}, Issues: ${issues.length}\n`);

console.log('=== ISSUES FOUND ===');
for (const iss of issues) {
  console.log(`[${iss.status}] ${iss.method} ${iss.frontendCall} in ${iss.file}:${iss.line}`);
  console.log(`  Details: ${iss.details}\n`);
}
