import { useAuth as useAuthContext } from "@providers/AuthProvider";

export function useAuth() {
  const ctx = useAuthContext();
  return {
    user: ctx.user,
    loading: ctx.isLoading,
    isAuthenticated: ctx.isAuthenticated,
    login: ctx.login,
    logout: ctx.logout,
    register: ctx.register,
    refreshUser: ctx.refreshUser,
    setUser: ctx.setUser,
    status: ctx.status,
  };
}