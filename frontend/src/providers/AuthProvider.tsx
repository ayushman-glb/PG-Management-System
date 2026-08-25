import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authService } from "@services/auth.service";
import type { User } from "@types";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated" | "refreshing" | "error";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState<AuthStatus>(() => {
    try {
      const cached = localStorage.getItem("user");
      if (cached) return "authenticated";
    } catch {}
    return "initializing";
  });
  const refreshInFlight = useRef<Promise<User | null> | null>(null);

  const setUser = useCallback((u: User | null) => {
    const normalizedUser = u ? {
      ...u,
      role: (u.role === "PG_OWNER" || u.role === "ADMIN" || u.role === "RESIDENT"
        ? u.role
        : (String(u.role).toUpperCase() === "OWNER" ? "PG_OWNER" : "RESIDENT")) as any
    } : null;

    setUserState(normalizedUser);
    setStatus(normalizedUser ? "authenticated" : "unauthenticated");
    try {
      if (normalizedUser) {
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        const r = String(normalizedUser.role || "").toUpperCase();
        if (r === "PG_OWNER" || r === "ADMIN") {
          localStorage.setItem("roombaeOwnerId", normalizedUser.id);
        }
        if ((normalizedUser as any).residentCode) {
          localStorage.setItem("residentCode", (normalizedUser as any).residentCode);
        }
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("roombaeOwnerId");
        localStorage.removeItem("residentCode");
      }
      window.dispatchEvent(new CustomEvent("roombae-auth-changed", { detail: normalizedUser }));
    } catch {}
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      try {
        const res = await authService.getCurrentUser();
        const u = res?.user || res || null;
        if (u) {
          setUserState(u);
          setStatus("authenticated");
          try {
            localStorage.setItem("user", JSON.stringify(u));
          } catch {}
        } else {
          setUserState(null);
          setStatus("unauthenticated");
          try {
            localStorage.removeItem("user");
          } catch {}
        }
        return u;
      } catch {
        setUserState(null);
        setStatus("unauthenticated");
        try {
          localStorage.removeItem("user");
        } catch {}
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  }, []);

  // On mount, check for existing session and subscribe to cross-tab auth signals
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      if (!authService.hasStoredSession()) {
        if (!cancelled) {
          setUserState(null);
          setStatus("unauthenticated");
          try {
            localStorage.removeItem("user");
          } catch {}
        }
        return;
      }
      try {
        const res = await authService.getCurrentUser();
        if (!cancelled) {
          const u = res?.user || res || null;
          if (u) {
            setUserState(u);
            setStatus("authenticated");
            try {
              localStorage.setItem("user", JSON.stringify(u));
            } catch {}
          } else {
            setUserState(null);
            setStatus("unauthenticated");
          }
        }
      } catch (err) {
        if (!cancelled) {
          authService.clearToken();
          setUserState(null);
          setStatus("unauthenticated");
          try {
            localStorage.removeItem("user");
          } catch {}
        }
      }
    };

    checkSession();

    const unsubscribe = authService.subscribeAuthState((isAuthenticated) => {
      if (cancelled) return;
      if (!isAuthenticated) {
        setUserState(null);
        setStatus("unauthenticated");
        try {
          localStorage.removeItem("user");
        } catch {}
      } else {
        refreshUser();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(async (credentials: { identifier: string; password: string }) => {
    try {
      const res = await authService.login(credentials);
      const u = res?.user || null;
      if (u) {
        setUserState(u);
        setStatus("authenticated");
        try {
          localStorage.setItem("user", JSON.stringify(u));
        } catch {}
      } else {
        setStatus("unauthenticated");
      }
      return u;
    } catch (err) {
      setUserState(null);
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; role?: string; phone?: string }) => {
    setUserState(null);
    setStatus("initializing");
    try {
      const res = await authService.register(data);
      const u = res?.user || null;
      if (u) {
        setUserState(u);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
      return u;
    } catch (err) {
      setUserState(null);
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setUserState(null);
    setStatus("unauthenticated");
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("roombaeOwnerId");
      localStorage.removeItem("residentCode");
      sessionStorage.removeItem("lazy_chunk_reload_once");
      window.dispatchEvent(new CustomEvent("roombae-auth-changed", { detail: null }));
    } catch {}
    try {
      await authService.logout();
    } finally {
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    isAuthenticated: !!user && status === "authenticated",
    isLoading: status === "initializing" || status === "refreshing",
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}