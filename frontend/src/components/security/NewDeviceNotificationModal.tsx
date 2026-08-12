import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Laptop, CheckCircle, AlertOctagon, X } from "lucide-react";

interface NewDeviceNotificationModalProps {
  isOpen: boolean;
  deviceLabel: string;
  onTrust: () => void;
  onRevoke: () => void;
  onClose: () => void;
}

export const NewDeviceNotificationModal: React.FC<NewDeviceNotificationModalProps> = ({
  isOpen,
  deviceLabel,
  onTrust,
  onRevoke,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">New Device Detected</h3>
                <p className="text-xs text-neutral-400">Security Check</p>
              </div>
            </div>

            <div className="p-4 mb-5 bg-neutral-800/60 rounded-xl border border-neutral-700/50 flex items-center gap-3">
              <div className="p-2.5 bg-neutral-700/50 rounded-lg text-neutral-300">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{deviceLabel || "Current Browser"}</p>
                <p className="text-xs text-amber-400/90 font-mono mt-0.5">Status: Unrecognized / New</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              We detected a sign-in from a new device or browser. If this was you, trust this device to skip future security prompts on this browser.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onRevoke}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all duration-200"
              >
                <AlertOctagon className="w-4 h-4" />
                Not Me (Revoke)
              </button>
              <button
                type="button"
                onClick={onTrust}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                Trust This Device
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
