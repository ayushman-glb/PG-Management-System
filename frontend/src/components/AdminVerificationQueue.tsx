import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { useTheme } from '../theme';


interface AdminVerificationQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminVerificationQueue: React.FC<AdminVerificationQueueProps> = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const [queue, setQueue] = useState([
    {
      id: 'owner-1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@roombae.com',
      phone: '+91 98765 43210',
      businessName: 'Luxe Stays & Co-Living LLP',
      gstin: '29ABCDE1234F1Z5',
      pgName: 'RoomBae Indiranagar Luxe PG',
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      kycVerified: true,
      docsCount: 5
    },
    {
      id: 'owner-2',
      name: 'Anil Sharma',
      email: 'anil.sharma@roombae.com',
      phone: '+91 98765 43211',
      businessName: 'Sharma Executive Hostels',
      gstin: '29FGHIJ5678K1Z2',
      pgName: 'RoomBae Koramangala Suite',
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'PENDING',
      kycVerified: true,
      docsCount: 4
    }
  ]);

  if (!isOpen) return null;

  const handleApprove = (id: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'APPROVED' } : item));
    alert('✓ Owner KYC & PG Property Approved! Listing published live.');
  };

  const handleReject = (id: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'REJECTED' } : item));
  };

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[#ffffff] border-[#dddddd] text-[#222222]";
  const cardBg = darkMode ? "bg-neutral-800/60 border-white/5 text-white" : "bg-[#f7f7f7] border-[#dddddd] text-[#222222]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6a6a6a]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border flex flex-col shadow-2xl ${modalBg}`}
        >
          {/* Header */}
          <div className="p-6 border-b border-amber-500/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Admin Verification &amp; Approval Queue</h2>
                <p className={`text-xs ${textMuted}`}>Review pending Owner KYC, Property Docs, &amp; Publish Commercial PG Listings</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Queue Item List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs" data-lenis-prevent>
            {queue.map(item => (
              <div key={item.id} className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : item.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className={textMuted}>Business: <strong>{item.businessName}</strong> (GSTIN: {item.gstin})</p>
                    <p className="text-amber-500 font-semibold">PG Listing: {item.pgName}</p>
                  </div>

                  {item.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold hover:bg-rose-500/30 cursor-pointer"
                      >
                        Reject ❌
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        Approve &amp; Publish Live ✔
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
