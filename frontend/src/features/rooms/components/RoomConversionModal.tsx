import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@services/api";
import { useTheme } from "@theme/index";

interface RoomConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData?: {
    id: string;
    roomNumber: string;
    type: string;
    capacity: number;
    baseRent: number;
  };
  onSuccess?: () => void;
}

export const RoomConversionModal: React.FC<RoomConversionModalProps> = ({
  isOpen,
  onClose,
  roomData,
  onSuccess,
}) => {
  const { darkMode } = useTheme();
  const [newType, setNewType] = useState<"SINGLE" | "DOUBLE" | "TRIPLE">(
    (roomData?.type as any) || "DOUBLE"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  const handleConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomData?.id) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.convertRoomCapacity(roomData.id, newType);
      setFeedback({ type: "success", message: `Room successfully converted to ${newType} sharing!` });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to convert room capacity" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalBg = darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]" : "bg-white border-[var(--border-main)] text-[var(--text-main)]";
  const cardBg = darkMode ? "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)]" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)]";
  const textPrimary = "text-[var(--text-main)]";
  const textMuted = "text-[var(--text-muted)]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-5 ${modalBg}`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Room Capacity Conversion</h3>
                <p className={`text-xs ${textMuted}`}>Room #{roomData?.roomNumber || "101"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
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
                        ? "bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-md"
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

            <div className="pt-4 border-t border-[var(--border-main)] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-medium cursor-pointer bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-6 py-2 text-xs font-semibold"
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
