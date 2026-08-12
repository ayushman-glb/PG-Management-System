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
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const refreshInFlight = useRef<Promise<User | null> | null>(null);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setStatus(u ? "authenticated" : "unauthenticated");
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      try {
        const res = await authService.getCurrentUser();
        const u = res?.user || res || null;
        setUserState(u);
        setStatus(u ? "authenticated" : "unauthenticated");
        return u;
      } catch (err) {
        setUserState(null);
        setStatus("unauthenticated");
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  }, []);

  // On mount, check for existing session
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await authService.getCurrentUser();
        if (!cancelled) {
          const u = res?.user || res || null;
          setUserState(u);
          setStatus(u ? "authenticated" : "unauthenticated");
        }
      } catch (err) {
        if (!cancelled) {
          authService.clearToken();
          setUserState(null);
          setStatus("unauthenticated");
        }
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: { identifier: string; password: string }) => {
    // Reset user state synchronously before logging in new user
    setUserState(null);
    setStatus("initializing");
    try {
      const res = await authService.login(credentials);
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
      localStorage.removeItem("roombaeOwnerId");
      localStorage.removeItem("residentCode");
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