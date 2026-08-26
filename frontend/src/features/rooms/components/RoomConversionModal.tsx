import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@services/api";
import { useTheme } from "../../../theme";

interface RoomConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData?: {
    id: string;
    roomNumber: string;
    roomType: string;
    currentBedsCount?: number;
  };
  onSuccess?: () => void;
}

export const RoomConversionModal: React.FC<RoomConversionModalProps> = ({
  isOpen,
  onClose,
  roomData,
  onSuccess,
}) => {
  const [newType, setNewType] = useState<"SINGLE" | "DOUBLE" | "TRIPLE">("DOUBLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  const handleConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomData?.id) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.put(`/rooms/${roomData.id}/convert`, {
        newType,
      });
      setFeedback({ type: "success", message: `Room ${roomData.roomNumber} successfully converted to ${newType} sharing!` });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Room conversion failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)]";
  const cardBg = darkMode ? "bg-neutral-800/40 border-white/5 text-neutral-300" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)]";
  const textPrimary = darkMode ? "text-white" : "text-[var(--text-main)]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[var(--text-muted)]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-5 ${modalBg}`}
        >
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Room Capacity Conversion</h3>
                <p className={`text-xs ${textMuted}`}>Room #{roomData?.roomNumber || "101"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${darkMode ? "bg-neutral-800 text-neutral-400 hover:text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/20 border border-rose-500/30 text-rose-400"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleConversion} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-2 ${textMuted}`}>SELECT TARGET CAPACITY / SHARING</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: "SINGLE", label: "Single", beds: "1 Bed" },
                  { type: "DOUBLE", label: "Double", beds: "2 Beds" },
                  { type: "TRIPLE", label: "Triple", beds: "3 Beds" },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setNewType(opt.type as any)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      newType === opt.type
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-500 font-bold shadow-lg"
                        : darkMode
                          ? "bg-neutral-800/60 border-white/5 text-neutral-400 hover:text-white"
                          : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <p className="text-sm font-black">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.beds}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${cardBg}`}>
              <p className={`font-semibold ${textPrimary}`}>Automated Capacity Adjustment:</p>
              <p>• Converting will automatically create or prune unoccupied beds.</p>
              <p>• PG total capacity and available bed metrics will update in real time.</p>
            </div>

            <div className="pt-4 border-t border-amber-500/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl font-medium cursor-pointer ${darkMode ? "bg-neutral-800 text-neutral-300 hover:text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? "Converting..." : "Confirm Conversion"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
