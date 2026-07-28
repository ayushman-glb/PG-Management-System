import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Residents from "./pages/Residents";
import Billing from "./pages/Billing";
import Complaints from "./pages/Complaints";
import Analytics from "./pages/Analytics";
import PGListing from "./pages/PGListing";
import PGDetails from "./pages/PGDetails";
import Auth from "./pages/Auth";
import Operations from "./pages/Operations";
import ContentPage from "./pages/ContentPage";
import ResidentPortal from "./pages/ResidentPortal";
import ResidentRegister from "./pages/ResidentRegister";
import { ThemeProvider } from "./theme";
import { NavigationProvider } from "./navigation";

export type Page =
  | "landing"
  | "dashboard"
  | "properties"
  | "residents"
  | "billing"
  | "complaints"
  | "analytics"
  | "pg-listing"
  | "pg-details"
  | "auth"
  | "resident-portal"
  | "resident-register"
  | "rooms"
  | "beds"
  | "visitors"
  | "notifications"
  | "settings"
  | "about"
  | "blog"
  | "careers"
  | "press"
  | "changelog"
  | "roadmap"
  | "documentation"
  | "help-center"
  | "api-reference"
  | "status"
  | "privacy-policy"
  | "terms-of-service"
  | "cookie-policy";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const navigate = (p: Page) => {
    if (p === page) return;
    setPageHistory((previous) => [...previous, page]);
    setPage(p);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const previous = pageHistory[pageHistory.length - 1] ?? "landing";
    setPageHistory((history) => history.slice(0, -1));
    setPage(previous);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThemeProvider>
      <NavigationProvider goBack={goBack}>
        {renderPage(page, navigate)}
        {loading && <LoadingOverlay />}
      </NavigationProvider>
    </ThemeProvider>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F5F2] animate-loading-in">
      <div className="flex flex-col items-center gap-6">
        <img src="./images/loading.png" alt="Room Bae" className="w-56 animate-pulse" />

        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full bg-[#C89B6D] animate-bounce"></span>
          <span className="h-2 w-2 rounded-full bg-[#C89B6D] animate-bounce delay-150"></span>
          <span className="h-2 w-2 rounded-full bg-[#C89B6D] animate-bounce delay-300"></span>
        </div>
      </div>
    </div>
  );
}

function renderPage(page: Page, navigate: (p: Page) => void) {
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
      return <Analytics navigate={navigate} />;
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
