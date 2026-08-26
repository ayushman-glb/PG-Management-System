import React, { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Page } from "./App";
import { RoleGuard } from "@guards/RoleGuard";
import { RouteGuard } from "@guards/RouteGuard";

/**
 * Enhanced lazy import wrapper that safely recovers from deployment chunk mismatches (404).
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      console.warn("[lazyWithRetry] Module import failed, attempting reload recovery...", err);
      const isChunkError =
        err?.message?.includes("Failed to fetch dynamically imported module") ||
        err?.message?.includes("Importing a module script failed") ||
        err?.name === "ChunkLoadError";
      if (isChunkError) {
        const key = "lazy_chunk_reload_once";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "true");
          window.location.reload();
        }
      }
      throw err;
    }
  });
}

const Landing = lazyWithRetry(() => import("@features/dashboard/pages/Landing"));
const Dashboard = lazyWithRetry(() => import("@features/dashboard/pages/Dashboard"));
const AdminConsole = lazyWithRetry(() => import("@features/dashboard/pages/AdminConsole"));
const Properties = lazyWithRetry(() => import("@features/properties/pages/Properties"));
const Residents = lazyWithRetry(() => import("@features/residents/pages/Residents"));
const Billing = lazyWithRetry(() => import("@features/billing/pages/Billing"));
const Complaints = lazyWithRetry(() => import("@features/complaints/pages/Complaints"));
const Analytics = lazyWithRetry(() => import("@features/analytics/pages/Analytics"));
const PGListing = lazyWithRetry(() => import("@features/properties/pages/PGListing"));
const PGDetails = lazyWithRetry(() => import("@features/properties/pages/PGDetails"));
const Auth = lazyWithRetry(() => import("@features/auth/pages/Auth"));
const CompleteProfile = lazyWithRetry(() => import("@features/auth/pages/CompleteProfile"));
const Operations = lazyWithRetry(() => import("@features/operations/pages/Operations"));

const ContentPage = lazyWithRetry(() => import("@features/dashboard/pages/ContentPage"));
const ResidentPortal = lazyWithRetry(() => import("@features/residents/pages/ResidentPortal"));
const VerifyAgreementPage = lazyWithRetry(() => import("@features/documents/pages/VerifyAgreementPage"));
const ResidentRegister = lazyWithRetry(() => import("@features/residents/pages/ResidentRegister"));
const ShortlistPage = lazyWithRetry(() => import("@features/search/pages/ShortlistPage"));
const ToursPage = lazyWithRetry(() => import("@features/search/pages/ToursPage"));
const ApplicationPage = lazyWithRetry(() => import("@features/search/pages/ApplicationPage"));
const MoveInDashboardPage = lazyWithRetry(() => import("@features/search/pages/MoveInDashboardPage"));
const NotFoundPage = lazyWithRetry(() => import("@features/dashboard/pages/NotFoundPage"));

interface RoutesProps {
  page: Page;
  navigate: (page: Page) => void;
}

const OWNER_ROLES = ["PG_OWNER"];
const ADMIN_ROLES = ["ADMIN"];
const RESIDENT_ROLES = ["RESIDENT"];

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
    case "god-console":
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
    case "verify-agreement":
      return <VerifyAgreementPage navigate={navigate} />;
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
    case "not-found":
      return <NotFoundPage navigate={navigate} />;
    default:
      return <Landing navigate={navigate} />;
  }
}
