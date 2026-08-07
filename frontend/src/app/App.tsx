import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@theme/index";
import { NavigationProvider } from "./navigation";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import loadingImg from "../assets/loading.png";

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
  | "complete-profile"
  | "resident-portal"

  | "resident-register"
  | "shortlist"
  | "tours"
  | "application"
  | "move-in-dashboard"
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
} from "../components/Skeletons";

export const BRANDED_LOADING_DURATION_MS = 2000;
export const SESSION_KEY = "loadingShown";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const directionRef = useRef<1 | -1>(1);

  const [showOneTimeLoading, setShowOneTimeLoading] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });

  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);

  // Handle Google OAuth callback query params (token, user, role, error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userJson = params.get("user");
    const role = params.get("role");
    const error = params.get("error");

    if (error) {
      console.warn("Google OAuth error:", error);
      // Clean the URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (token) {
      try {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("token", token);
        if (userJson) {
          localStorage.setItem("user", decodeURIComponent(userJson));
        }
        const targetPage: Page =
          role === "RESIDENT" ? "resident-portal" : "dashboard";
        setPage(targetPage);
        // Clean the URL without reloading
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        console.error("Failed to process OAuth callback:", e);
      }
    }
  }, []);

  useEffect(() => {
    let timer: number;
    let debugTimer: number;

    if (showOneTimeLoading) {
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
    directionRef.current = 1;
    setPageHistory((previous) => [...previous, page]);
    setPage(p);
    setSkeletonLoading(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goBack = () => {
    const previous = pageHistory[pageHistory.length - 1] ?? "landing";
    directionRef.current = -1;
    setPageHistory((history) => history.slice(0, -1));
    setPage(previous);
    setSkeletonLoading(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <AppProviders>
      <NavigationProvider goBack={goBack}>
        <AnimatePresence>
          {showOneTimeLoading && <LoadingOverlay key="branded-overlay" />}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {skeletonLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <PageSkeleton page={page} />
            </motion.div>
          ) : (
            <motion.div
              key={page}
              custom={directionRef.current}
              variants={{
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -8 },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <AppRoutes page={page} navigate={navigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </NavigationProvider>
    </AppProviders>
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
        <img
          src={loadingImg}
          alt="RoomBae"
          className="w-52 md:w-60 animate-pulse filter drop-shadow-md"
        />

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
