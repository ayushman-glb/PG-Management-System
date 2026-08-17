import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketingPreviewModalProps {
  isOpen: boolean;
  htmlContent: string;
  subject: string;
  audience: string;
  onClose: () => void;
  onConfirmSend?: () => void;
}

export const MarketingPreviewModal: React.FC<MarketingPreviewModalProps> = ({
  isOpen,
  htmlContent,
  subject,
  audience,
  onClose,
  onConfirmSend,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📧</span> Email Campaign Live Preview
              </h3>
              <p className="text-xs text-slate-400">
                Subject: <strong className="text-amber-400">{subject}</strong> &bull; Audience:{' '}
                <span className="text-slate-200">{audience}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    deviceView === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🖥 Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    deviceView === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📱 Mobile
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Email Preview Frame */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/60 flex justify-center items-start">
            <div
              className={`bg-[#0b0f17] rounded-xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${
                deviceView === 'mobile' ? 'w-[375px] min-h-[550px]' : 'w-full max-w-[620px] min-h-[550px]'
              }`}
            >
              <iframe
                title="Email Preview"
                srcDoc={htmlContent}
                className="w-full h-[550px] border-none"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
            <span className="text-xs text-slate-400">
              ⚡ Rendering using RoomBae Apple/Bento UI Design System
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Close Preview
              </button>
              {onConfirmSend && (
                <button
                  type="button"
                  onClick={onConfirmSend}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md transition"
                >
                  Send Campaign Now
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default MarketingPreviewModal;
