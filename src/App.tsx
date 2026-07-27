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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-white animate-loading-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl shadow-blue-500/30">
          <span className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-ping" />
          <span className="text-xl font-black">PG</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-loading-dot" />
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-loading-dot [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-loading-dot [animation-delay:240ms]" />
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
