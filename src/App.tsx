import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { ThemeProvider, useTheme } from "./theme";
import { NavigationProvider } from "./navigation";
import { SmoothScroll } from "./components/SmoothScroll";
import { ScrollProgressBar } from "./components/ScrollProgressBar";
import loadingImg from "../public/images/loading.png";

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

import {
  ENABLE_SKELETON_DEBUG_DELAY,
  SKELETON_DEBUG_DELAY_MS,
  PageSkeleton,
} from "./components/Skeletons";

export const BRANDED_LOADING_DURATION_MS = 2000;
export const SESSION_KEY = "loadingShown";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);

  // Check sessionStorage on initial load.
  // The custom branded loading screen appears ONLY ONCE per browser session for EXACTLY 2 seconds.
  const [showOneTimeLoading, setShowOneTimeLoading] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });

  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);

  useEffect(() => {
    let timer: number;
    let debugTimer: number;

    if (showOneTimeLoading) {
      // First visit in current session: Show custom branded loading screen for EXACTLY 2 seconds (2000ms)
      timer = window.setTimeout(() => {
        setShowOneTimeLoading(false);
        try {
          sessionStorage.setItem(SESSION_KEY, "true");
        } catch (e) {
          console.error("Failed to update sessionStorage:", e);
        }

        if (ENABLE_SKELETON_DEBUG_DELAY) {
          setSkeletonLoading(true);
          debugTimer = window.setTimeout(() => {
            setSkeletonLoading(false);
          }, SKELETON_DEBUG_DELAY_MS);
        }
      }, BRANDED_LOADING_DURATION_MS);
    } else {
      // Subsequent visits in session: skip splash intro completely.
      if (ENABLE_SKELETON_DEBUG_DELAY) {
        setSkeletonLoading(true);
        debugTimer = window.setTimeout(() => {
          setSkeletonLoading(false);
        }, SKELETON_DEBUG_DELAY_MS);
      }
    }

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(debugTimer);
    };
  }, [showOneTimeLoading]);

  const navigate = (p: Page) => {
    if (p === page) return;
    setPageHistory((previous) => [...previous, page]);
    setPage(p);

    // Never trigger showOneTimeLoading on navigation!
    if (ENABLE_SKELETON_DEBUG_DELAY) {
      setSkeletonLoading(true);
      window.setTimeout(() => {
        setSkeletonLoading(false);
      }, SKELETON_DEBUG_DELAY_MS);
    } else {
      setSkeletonLoading(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const previous = pageHistory[pageHistory.length - 1] ?? "landing";
    setPageHistory((history) => history.slice(0, -1));
    setPage(previous);

    // Never trigger showOneTimeLoading on goBack!
    if (ENABLE_SKELETON_DEBUG_DELAY) {
      setSkeletonLoading(true);
      window.setTimeout(() => {
        setSkeletonLoading(false);
      }, SKELETON_DEBUG_DELAY_MS);
    } else {
      setSkeletonLoading(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThemeProvider>
      <SmoothScroll>
        <ScrollProgressBar />
        <NavigationProvider goBack={goBack}>
          {/* 1. Custom One-Time Branded Loading Screen (Session Level) */}
          <AnimatePresence>
            {showOneTimeLoading && <LoadingOverlay key="branded-overlay" />}
          </AnimatePresence>

          {/* 2. Skeleton & Main Content Rendering */}
          <AnimatePresence mode="wait">
            {skeletonLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PageSkeleton page={page} />
              </motion.div>
            ) : (
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {renderPage(page, navigate)}
              </motion.div>
            )}
          </AnimatePresence>
        </NavigationProvider>
      </SmoothScroll>
    </ThemeProvider>
  );
}

function LoadingOverlay() {
  const { darkMode } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-busy="true"
      aria-label="Loading RoomBae"
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <img src={loadingImg} alt="RoomBae" className="w-52 md:w-60 animate-pulse filter drop-shadow-md" />

        <div className="flex gap-2.5 items-center">
          <span
            className={`h-2.5 w-2.5 rounded-full animate-bounce ${
              darkMode ? "bg-[#C89A4B]" : "bg-[#D9A87C]"
            }`}
          />
          <span
            className={`h-2.5 w-2.5 rounded-full animate-bounce delay-150 ${
              darkMode ? "bg-[#D8B36A]" : "bg-[#C58B63]"
            }`}
          />
          <span
            className={`h-2.5 w-2.5 rounded-full animate-bounce delay-300 ${
              darkMode ? "bg-[#E8C98A]" : "bg-[#E7C4A0]"
            }`}
          />
        </div>
      </div>
    </motion.div>
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
