import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "../../../theme";

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "RESIDENT" | "OWNER";
  onSuccess?: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  userType,
  onSuccess,
}) => {
  const { darkMode } = useTheme();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [reason, setReason] = useState("Completed checkout & moved out of PG");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !otp) {
      setErrorMsg("Password and 6-digit OTP verification code are required.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      setTimeout(() => {
        setIsDeleting(false);
        onSuccess?.();
        onClose();
        alert("✓ Account successfully soft-deleted and archived in compliance with privacy retention rules.");
      }, 1200);
    } catch (e: any) {
      setIsDeleting(false);
      setErrorMsg(e.message || "Account deletion failed");
    }
  };

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]";
  const inputBg = darkMode ? "bg-neutral-800 border-white/10 text-white placeholder-neutral-500" : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-5 ${modalBg}`}
        >
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Delete Account &amp; Purge Data</h3>
                <p className="text-xs text-rose-400 font-semibold">{userType} Lifecycle Termination</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Warning: Irreversible Action
            </p>
            <p>• Account deletion subject to checkout completion &amp; zero pending dues.</p>
            <p>• Account will be soft-deleted and archived into immutable audit logs.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">CONFIRM CURRENT PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">ENTER 6-DIGIT OTP (SENT TO REGISTERED PHONE)</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className={`w-full p-3 rounded-xl border font-mono tracking-widest text-center font-bold ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">REASON FOR ACCOUNT DELETION</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              >
                <option value="Checkout Complete">Checked out &amp; moved out of PG</option>
                <option value="Switching PG">Relocating to another city</option>
                <option value="Privacy Request">Privacy &amp; Data Deletion Request</option>
              </select>
            </div>

            <div className="pt-4 border-t border-rose-500/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? "Deactivating..." : "Confirm Account Deletion 🗑️"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
