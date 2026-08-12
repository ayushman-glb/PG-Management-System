import React, { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Page } from "./App";
import { RoleGuard } from "@guards/RoleGuard";
import { RouteGuard } from "@guards/RouteGuard";

const Landing = lazy(() => import("@features/dashboard/pages/Landing"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const AdminConsole = lazy(() => import("@features/dashboard/pages/AdminConsole"));
const Properties = lazy(() => import("@features/properties/pages/Properties"));
const Residents = lazy(() => import("@features/residents/pages/Residents"));
const Billing = lazy(() => import("@features/billing/pages/Billing"));
const Complaints = lazy(() => import("@features/complaints/pages/Complaints"));
const Analytics = lazy(() => import("@features/analytics/pages/Analytics"));
const PGListing = lazy(() => import("@features/properties/pages/PGListing"));
const PGDetails = lazy(() => import("@features/properties/pages/PGDetails"));
const Auth = lazy(() => import("@features/auth/pages/Auth"));
const CompleteProfile = lazy(() => import("@features/auth/pages/CompleteProfile"));
const Operations = lazy(() => import("@features/operations/pages/Operations"));

const ContentPage = lazy(() => import("@features/dashboard/pages/ContentPage"));
const ResidentPortal = lazy(() => import("@features/residents/pages/ResidentPortal"));
const ResidentRegister = lazy(() => import("@features/residents/pages/ResidentRegister"));
const ShortlistPage = lazy(() => import("@features/search/pages/ShortlistPage"));
const ToursPage = lazy(() => import("@features/search/pages/ToursPage"));
const ApplicationPage = lazy(() => import("@features/search/pages/ApplicationPage"));
const MoveInDashboardPage = lazy(() => import("@features/search/pages/MoveInDashboardPage"));

interface RoutesProps {
  page: Page;
  navigate: (page: Page) => void;
}

const OWNER_ROLES = ["OWNER", "ADMIN", "SUPER_ADMIN", "MANAGER"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const RESIDENT_ROLES = ["RESIDENT", "ADMIN", "SUPER_ADMIN"];

export const AppRoutes: React.FC<RoutesProps> = ({ page, navigate }) => {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 max-w-4xl mx-auto">
          <div className="h-10 w-48 skeleton-wave" />
          <div className="h-40 w-full skeleton-wave" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-28 skeleton-wave" />
            <div className="h-28 skeleton-wave" />
            <div className="h-28 skeleton-wave" />
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {renderRoute(page, navigate)}
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
};

function renderRoute(page: Page, navigate: (p: Page) => void) {
  switch (page) {
    case "landing":
      return <Landing navigate={navigate} />;
    case "dashboard":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Dashboard navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "admin-console":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={ADMIN_ROLES}>
            <AdminConsole navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "resident-portal":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={RESIDENT_ROLES}>
            <ResidentPortal navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "properties":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Properties navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "residents":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Residents navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "billing":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Billing navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "complaints":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Complaints navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "analytics":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Analytics navigate={navigate} />
          </RoleGuard>
        </RouteGuard>
      );
    case "rooms":
    case "beds":
    case "visitors":
    case "notifications":
    case "settings":
      return (
        <RouteGuard>
          <RoleGuard allowedRoles={OWNER_ROLES}>
            <Operations navigate={navigate} page={page} />
          </RoleGuard>
        </RouteGuard>
      );
    case "pg-listing":
      return <PGListing navigate={navigate} />;
    case "pg-details":
      return <PGDetails navigate={navigate} />;
    case "shortlist":
      return <ShortlistPage navigate={navigate} />;
    case "tours":
      return <ToursPage navigate={navigate} />;
    case "application":
      return <ApplicationPage navigate={navigate} />;
    case "move-in-dashboard":
      return <MoveInDashboardPage navigate={navigate} />;
    case "auth":
      return <Auth navigate={navigate} />;
    case "complete-profile":
      return <CompleteProfile navigate={navigate} />;
    case "resident-register":
      return <ResidentRegister navigate={navigate} />;
    case "about":
    case "blog":
    case "careers":
    case "press":
    case "changelog":
    case "roadmap":
    case "documentation":
    case "help-center":
    case "api-reference":
    case "status":
    case "privacy-policy":
    case "terms-of-service":
    case "cookie-policy":
      return <ContentPage navigate={navigate} page={page} />;
    default:
      return <Landing navigate={navigate} />;
  }
}
