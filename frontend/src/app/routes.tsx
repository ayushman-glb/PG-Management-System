import React, { lazy, Suspense } from "react";
import type { Page } from "./App";
import { RoleGuard } from "@guards/RoleGuard";

const Landing = lazy(() => import("@features/dashboard/pages/Landing"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const Properties = lazy(() => import("@features/properties/pages/Properties"));
const Residents = lazy(() => import("@features/residents/pages/Residents"));
const Billing = lazy(() => import("@features/billing/pages/Billing"));
const Complaints = lazy(() => import("@features/complaints/pages/Complaints"));
const Analytics = lazy(() => import("@features/analytics/pages/Analytics"));
const PGListing = lazy(() => import("@features/properties/pages/PGListing"));
const PGDetails = lazy(() => import("@features/properties/pages/PGDetails"));
const Auth = lazy(() => import("@features/auth/pages/Auth"));
const Operations = lazy(() => import("@features/operations/pages/Operations"));
const ContentPage = lazy(() => import("@features/dashboard/pages/ContentPage"));
const ResidentPortal = lazy(() => import("@features/residents/pages/ResidentPortal"));
const ResidentRegister = lazy(() => import("@features/residents/pages/ResidentRegister"));

interface RoutesProps {
  page: Page;
  navigate: (page: Page) => void;
}

export const AppRoutes: React.FC<RoutesProps> = ({ page, navigate }) => {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading view...</div>}>
      {renderRoute(page, navigate)}
    </Suspense>
  );
};

function renderRoute(page: Page, navigate: (p: Page) => void) {
  switch (page) {
    case "landing":
      return <Landing navigate={navigate} />;
    case "dashboard":
      return <Dashboard navigate={navigate} />;
    case "properties":
      return <Properties navigate={navigate} />;
    case "residents":
      return <Residents navigate={navigate} />;
    case "billing":
      return <Billing navigate={navigate} />;
    case "complaints":
      return <Complaints navigate={navigate} />;
    case "analytics":
      return (
        <RoleGuard allowedRoles={["admin", "ADMIN", "owner", "OWNER", "pg_owner", "PG_OWNER", "super_admin", "SUPER_ADMIN", "manager", "MANAGER"]}>
          <Analytics navigate={navigate} />
        </RoleGuard>
      );
    case "pg-listing":
      return <PGListing navigate={navigate} />;
    case "pg-details":
      return <PGDetails navigate={navigate} />;
    case "auth":
      return <Auth navigate={navigate} />;
    case "resident-portal":
      return <ResidentPortal navigate={navigate} />;
    case "resident-register":
      return <ResidentRegister navigate={navigate} />;
    case "rooms":
      return <Operations navigate={navigate} page="rooms" />;
    case "beds":
      return <Operations navigate={navigate} page="beds" />;
    case "visitors":
      return <Operations navigate={navigate} page="visitors" />;
    case "notifications":
      return <Operations navigate={navigate} page="notifications" />;
    case "settings":
      return <Operations navigate={navigate} page="settings" />;
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
