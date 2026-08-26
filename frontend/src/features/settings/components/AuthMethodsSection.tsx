import React, { useState, useEffect } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Lock, Unlink, RefreshCw } from "lucide-react";
import { useTheme } from "@theme/index";
import { authService } from "../../../services/auth.service";

export const AuthMethodsSection: React.FC = () => {
  const { darkMode } = useTheme();
  const [methods, setMethods] = useState<{
    hasPassword: boolean;
    isGoogleLinked: boolean;
    googleEmail: string | null;
    is2FAEnabled: boolean;
  }>({
    hasPassword: true,
    isGoogleLinked: false,
    googleEmail: null,
    is2FAEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password creation state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Unlink Google state
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState("");

  const loadAuthMethods = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authService.getAuthMethods();
      if (data) {
        setMethods(data);
      }
    } catch (err: any) {
      console.warn("Could not load authentication methods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthMethods();
  }, []);

  const handleConnectGoogle = () => {
    try {
      authService.initiateGoogleOAuth("RESIDENT", window.location.href);
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google connection.");
    }
  };

  const handleUnlinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methods.hasPassword && !unlinkPassword) {
      setError("You must create a password before unlinking your Google account.");
      return;
    }
    try {
      setActionLoading(true);
      setError("");
      await authService.unlinkGoogleAccount(unlinkPassword || undefined);
      setSuccess("Google account unlinked successfully.");
      setShowUnlinkModal(false);
      setUnlinkPassword("");
      await loadAuthMethods();
    } catch (err: any) {
      setError(err.message || "Failed to unlink Google account.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      await authService.createPassword(newPassword);
      setSuccess("RoomBae password created successfully.");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      await loadAuthMethods();
    } catch (err: any) {
      setError(err.message || "Failed to set password.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border ${
        darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]" : "bg-white border-[var(--border-main)] text-[var(--text-main)]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Authentication Methods &amp; Identity Providers</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Manage sign-in options, linked Google identity, and account credentials
            </p>
          </div>
        </div>

        <button
          onClick={loadAuthMethods}
          disabled={loading}
          className="p-2 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] cursor-pointer transition-colors"
          title="Refresh auth methods"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--brand-primary)]" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Google Identity Provider Card */}
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[var(--bg-surface)] border-[var(--border-main)]" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-bold">Google Account</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {methods.isGoogleLinked ? methods.googleEmail || "Connected" : "Not Connected"}
                </p>
              </div>
            </div>

            {methods.isGoogleLinked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-3 h-3" /> Linked
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-semibold">
                Disabled
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex justify-end">
            {methods.isGoogleLinked ? (
              <button
                type="button"
                onClick={() => setShowUnlinkModal(true)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" /> Unlink Google
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="btn-primary px-3 py-1.5 text-xs font-bold"
              >
                Connect Google
              </button>
            )}
          </div>
        </div>

        {/* RoomBae Password Card */}
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[var(--bg-surface)] border-[var(--border-main)]" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">RoomBae Password</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {methods.hasPassword ? "Password configured" : "No password set (Google only)"}
                </p>
              </div>
            </div>

            {methods.hasPassword ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[var(--accent-ruby)]/20 text-[var(--accent-ruby)] border border-[var(--accent-ruby)]/30 text-xs font-bold">
                Action Recommended
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex justify-end">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="btn-primary px-3 py-1.5 text-xs font-bold"
            >
              {methods.hasPassword ? "Change Password" : "Create Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
              darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]" : "bg-white border-[var(--border-main)] text-[var(--text-main)]"
            }`}
          >
            <h3 className="text-lg font-black mb-2">Create RoomBae Password</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Setting a password allows you to sign in with your email directly and enables safe recovery.
            </p>

            <form onSubmit={handleCreatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">New Password (min. 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs font-medium focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs font-medium focus:outline-none focus:border-[var(--brand-primary)]"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary px-4 py-2 text-xs font-bold"
                >
                  {actionLoading ? "Saving..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlink Google Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
              darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]" : "bg-white border-[var(--border-main)] text-[var(--text-main)]"
            }`}
          >
            <h3 className="text-lg font-black mb-2 text-rose-500">Unlink Google Identity</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Are you sure you want to disconnect Google? You will need your RoomBae password to sign in afterwards.
            </p>

            <form onSubmit={handleUnlinkGoogle} className="space-y-3">
              {methods.hasPassword && (
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">Confirm with RoomBae Password</label>
                  <input
                    type="password"
                    required
                    value={unlinkPassword}
                    onChange={(e) => setUnlinkPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs font-medium focus:outline-none focus:border-rose-500"
                    placeholder="Enter current password"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnlinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all"
                >
                  {actionLoading ? "Unlinking..." : "Confirm Unlink"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
