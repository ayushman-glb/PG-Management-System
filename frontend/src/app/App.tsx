import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavigationProvider } from "./navigation";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { InteractiveVideoLoader } from "../components/animations/InteractiveVideoLoader";
import { authService } from "../services/auth.service";
import { useUIStore } from "../store/useUIStore";
import { updateDocumentSEO } from "../config/seo.config";
import { ErrorBoundary } from "../components/feedback/ErrorBoundary";

export type Page =
  | "landing"
  | "dashboard"
  | "admin-console"
  | "god-console"
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
  | "verify-agreement"
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
  | "cookie-policy"
  | "not-found";

import {
  ENABLE_SKELETON_DEBUG_DELAY,
  SKELETON_DEBUG_DELAY_MS,
  PageSkeleton,
} from "../components/Skeletons";

export const BRANDED_LOADING_DURATION_MS = 2000;
export const SESSION_KEY = "loadingShown";

import { NewDeviceNotificationModal } from "../components/security/NewDeviceNotificationModal";
import { deviceService } from "../services/device.service";

const VALID_PAGES: Set<string> = new Set([
  "landing",
  "dashboard",
  "admin-console",
  "god-console",
  "properties",
  "residents",
  "billing",
  "complaints",
  "analytics",
  "pg-listing",
  "pg-details",
  "auth",
  "complete-profile",
  "resident-portal",
  "verify-agreement",
  "resident-register",
  "shortlist",
  "tours",
  "application",
  "move-in-dashboard",
  "rooms",
  "beds",
  "visitors",
  "notifications",
  "settings",
  "about",
  "blog",
  "careers",
  "press",
  "changelog",
  "roadmap",
  "documentation",
  "help-center",
  "api-reference",
  "status",
  "privacy-policy",
  "terms-of-service",
  "cookie-policy",
  "not-found",
]);

function getInitialPageFromPath(): Page {
  if (typeof window === "undefined") return "landing";
  const raw = window.location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!raw || raw === "PG-Management-System") return "landing";
  const clean = raw.replace(/^PG-Management-System\/?/, "");
  if (clean === "login" || clean === "signup" || clean === "register") return "auth";
  if (VALID_PAGES.has(clean)) return clean as Page;
  return "not-found";
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPageFromPath);
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const directionRef = useRef<1 | -1>(1);
  const { newDeviceModal, closeNewDeviceModal } = useUIStore();

  const [showOneTimeLoading, setShowOneTimeLoading] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });

  const [skeletonLoading, setSkeletonLoading] = useState<boolean>(false);

  // Handle OAuth callback: backend sets tokens via cookies and/or query token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth");
    const role = params.get("role");
    const pageParam = params.get("page");
    const token = params.get("token");
    const residentCode = params.get("code");
    const error = params.get("error");

    if (error) {
      console.warn("Google OAuth error:", error);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (token) {
      authService.setToken(token, "LOGIN");
    }

    if (pageParam === "complete-profile") {
      setPage("complete-profile");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (oauthSuccess === "success") {
      try {
        if (residentCode) {
          localStorage.setItem("residentCode", residentCode);
        }
        const targetPage: Page =
          pageParam === "complete-profile"
            ? "complete-profile"
            : role === "RESIDENT"
            ? "resident-portal"
            : role === "ADMIN"
            ? "admin-console"
            : "dashboard";
        setPage(targetPage);
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        console.error("Failed to process OAuth callback:", e);
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
  }, []);

  useEffect(() => {
    let debugTimer: number;

    if (!showOneTimeLoading && ENABLE_SKELETON_DEBUG_DELAY) {
      setSkeletonLoading(true);
      debugTimer = window.setTimeout(() => {
        setSkeletonLoading(false);
      }, SKELETON_DEBUG_DELAY_MS);
    }

    return () => {
      window.clearTimeout(debugTimer);
    };
  }, [showOneTimeLoading]);

  useEffect(() => {
    const handlePopState = () => {
      const p = getInitialPageFromPath();
      setPage(p);
      setSkeletonLoading(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    updateDocumentSEO(page);
  }, [page]);

  const navigate = (p: Page) => {
    if (p === page) return;
    directionRef.current = 1;
    setPageHistory((previous) => [...previous, page]);
    setPage(p);
    setSkeletonLoading(false);
    const targetUrl = p === "landing" ? "/" : `/${p}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, "", targetUrl);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goBack = () => {
    const previous = pageHistory[pageHistory.length - 1] ?? "landing";
    directionRef.current = -1;
    setPageHistory((history) => history.slice(0, -1));
    setPage(previous);
    setSkeletonLoading(false);
    const targetUrl = previous === "landing" ? "/" : `/${previous}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, "", targetUrl);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <AppProviders>
      <NavigationProvider goBack={goBack}>
        <AnimatePresence>
          {showOneTimeLoading && (
            <InteractiveVideoLoader
              key="branded-spatial-loader"
              videoSrc="/back.mp4"
              durationMs={3000}
              onComplete={() => {
                setShowOneTimeLoading(false);
                try {
                  sessionStorage.setItem(SESSION_KEY, "true");
                } catch (e) {
                  console.error("Failed to update sessionStorage:", e);
                }
              }}
            />
          )}
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
              <ErrorBoundary>
                <AppRoutes page={page} navigate={navigate} />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
        <NewDeviceNotificationModal
          isOpen={newDeviceModal.isOpen}
          deviceLabel={newDeviceModal.deviceLabel}
          ipAddress={newDeviceModal.ipAddress}
          region={newDeviceModal.region}
          screenResolution={newDeviceModal.screenResolution}
          onAccept={async () => {
            try {
              const { deviceIdentityProvider } = await import("../services/deviceIdentity");
              const identity = await deviceIdentityProvider.getDeviceIdentity();
              await deviceService.respondToNewDeviceAlert({
                visitorId: newDeviceModal.visitorId || identity.visitorId,
                decision: "ACCEPT",
                screenResolution: newDeviceModal.screenResolution || identity.screenResolution,
                deviceLabel: newDeviceModal.deviceLabel || identity.deviceLabel,
                deviceId: newDeviceModal.deviceId,
              });
            } catch (err: any) {
              console.warn("Failed to accept new device login:", err);
            } finally {
              closeNewDeviceModal();
            }
          }}
          onReject={async () => {
            try {
              const { deviceIdentityProvider } = await import("../services/deviceIdentity");
              const identity = await deviceIdentityProvider.getDeviceIdentity();
              await deviceService.respondToNewDeviceAlert({
                visitorId: newDeviceModal.visitorId || identity.visitorId,
                decision: "REJECT",
                screenResolution: newDeviceModal.screenResolution || identity.screenResolution,
                deviceLabel: newDeviceModal.deviceLabel || identity.deviceLabel,
                deviceId: newDeviceModal.deviceId,
              });
            } catch (err: any) {
              console.warn("Failed to reject new device login:", err);
            } finally {
              closeNewDeviceModal();
              authService.clearToken();
              try {
                await authService.logout().catch(() => {});
              } catch {}
              navigate("auth");
            }
          }}
          onClose={closeNewDeviceModal}
        />
      </NavigationProvider>
    </AppProviders>
  );
}

