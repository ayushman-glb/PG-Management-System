import { useState, useEffect } from "react";
import { authService } from "@services/auth.service";
import type { User } from "@types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      authService
        .getCurrentUser()
        .then((res) => setUser(res.user || res || null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    const res = await authService.login(credentials);
    const token = res?.accessToken || res?.token;
    if (res?.user && token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    setUser(null);
  };

  return { user, loading, isAuthenticated: !!user, login, logout };
}
