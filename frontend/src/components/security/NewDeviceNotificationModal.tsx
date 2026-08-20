import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Laptop,
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  X,
  Loader2,
} from "lucide-react";

interface NewDeviceNotificationModalProps {
  isOpen: boolean;
  deviceLabel: string;
  ipAddress?: string;
  region?: string;
  screenResolution?: string;
  onAccept: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
  onClose?: () => void;
}

export const NewDeviceNotificationModal: React.FC<NewDeviceNotificationModalProps> = ({
  isOpen,
  deviceLabel,
  ipAddress,
  region,
  screenResolution,
  onAccept,
  onReject,
  onClose,
}) => {
  const [loadingAction, setLoadingAction] = useState<"ACCEPT" | "REJECT" | null>(null);

  const handleAccept = async () => {
    if (loadingAction) return;
    setLoadingAction("ACCEPT");
    try {
      await onAccept();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    if (loadingAction) return;
    setLoadingAction("REJECT");
    try {
      await onReject();
    } finally {
      setLoadingAction(null);
    }
  };

  const isMobile =
    deviceLabel.toLowerCase().includes("mobile") ||
    deviceLabel.toLowerCase().includes("ios") ||
    deviceLabel.toLowerCase().includes("android") ||
    deviceLabel.toLowerCase().includes("iphone");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden bg-neutral-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 text-white"
          >
            {onClose && (
              <button
                onClick={onClose}
                disabled={loadingAction !== null}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header Badge */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    New Device Sign-in Detected
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full uppercase tracking-wider">
                    Alert
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  FingerprintJS Device Identification & Security Check
                </p>
              </div>
            </div>

            {/* Telemetry Bento Grid */}
            <div className="space-y-2.5 mb-5">
              <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-neutral-800 flex items-center gap-3">
                <div className="p-2.5 bg-neutral-800 text-amber-400 rounded-lg border border-neutral-700/50">
                  {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400">Device & Browser</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {deviceLabel || "Current Browser Client"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-neutral-400">Screen Size</p>
                    <p className="text-xs font-medium text-neutral-200 truncate">
                      {screenResolution || "Auto-detected"}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-neutral-400">IP Address</p>
                    <p className="text-xs font-mono font-medium text-neutral-200 truncate">
                      {ipAddress || "127.0.0.1"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-400">Location / Region</p>
                  <p className="text-xs font-medium text-neutral-200 truncate">
                    {region || "Localhost / Local Dev Environment"}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <p className="text-xs text-neutral-300 leading-relaxed">
                A security alert email has also been sent to your registered address. If you recognize this sign-in, click <strong className="text-amber-300">Accept & Trust</strong>. If you do not recognize this activity, click <strong className="text-rose-400">Deny & Log Out</strong> to terminate access immediately.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleReject}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction === "REJECT" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )}
                Deny & Log Out
              </button>

              <button
                type="button"
                onClick={handleAccept}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction === "ACCEPT" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Accept & Trust
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
