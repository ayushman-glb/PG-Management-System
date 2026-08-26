import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { useTheme } from "../../../theme";

interface FineManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentData?: any;
  onSuccess?: () => void;
}

export const FineManagementModal: React.FC<FineManagementModalProps> = ({
  isOpen,
  onClose,
  residentData,
  onSuccess,
}) => {
  const { darkMode } = useTheme();
  const [fineType, setFineType] = useState<"LATE_RENT" | "DAMAGE" | "ELECTRICITY" | "WATER" | "CLEANING" | "CUSTOM">("LATE_RENT");
  const [amount, setAmount] = useState<number>(500);
  const [reason, setReason] = useState<string>("Late rent penalty beyond 3 days grace period");
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);

  if (!isOpen) return null;

  const handleIssueFine = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.();
    onClose();
  };

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[#ffffff] border-[#dddddd] text-[#222222]";
  const inputBg = darkMode ? "bg-neutral-800 border-white/10 text-white placeholder-neutral-500" : "bg-[#f7f7f7] border-[#dddddd] text-[#222222]";

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
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Issue Automated Fine</h3>
                <p className="text-xs text-neutral-400">Resident: {residentData?.name || "Rahul Sharma"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleIssueFine} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">FINE CATEGORY</label>
              <select
                value={fineType}
                onChange={(e) => setFineType(e.target.value as any)}
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              >
                <option value="LATE_RENT">Late Rent Payment Penalty</option>
                <option value="DAMAGE">Room / Property Structural Damage</option>
                <option value="ELECTRICITY">Overdue Electricity Surcharge</option>
                <option value="CLEANING">Room Deep Cleaning Penalty</option>
                <option value="CUSTOM">Custom Code Violation Fine</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">FINE AMOUNT (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">REASON / CLAUSE DESCRIPTION</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1">PAYMENT DUE DATE</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full p-3 rounded-xl border ${inputBg}`}
              />
            </div>

            <div className="pt-4 border-t border-amber-500/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Issue Fine &amp; Add to Invoice
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
