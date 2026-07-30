import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

import { api } from '../services/api';

interface BedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedData?: {
    id: string;
    bedNumber: string;
    status: string;
    roomNumber?: string;
    residentName?: string;
  };
  onSuccess?: () => void;
}

export const BedManagementModal: React.FC<BedManagementModalProps> = ({
  isOpen,
  onClose,
  bedData,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'hold'>('status');
  const [status, setStatus] = useState(bedData?.status || 'AVAILABLE');
  const [notes, setNotes] = useState('');
  const [holdReason, setHoldReason] = useState('MAINTENANCE');
  const [holdStartDate, setHoldStartDate] = useState('');
  const [holdEndDate, setHoldEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedData?.id) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.updateBedStatus(bedData.id, status, notes || undefined);
      setFeedback({ type: 'success', message: `Bed status updated to ${status}!` });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update bed status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedData?.id) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createBedHold(
        bedData.id,
        holdReason,
        holdStartDate || undefined,
        holdEndDate || undefined,
        notes || undefined
      );
      setFeedback({ type: 'success', message: 'Bed placed on hold successfully!' });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to place bed on hold' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 p-6 text-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Bed Management</h3>
                <p className="text-sm text-neutral-400">
                  Bed #{bedData?.bedNumber || '101-A'} {bedData?.roomNumber ? `(${bedData.roomNumber})` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-neutral-800/60 mb-5">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'status' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Update Status
            </button>
            <button
              onClick={() => setActiveTab('hold')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'hold' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Place Bed On Hold
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'status' ? (
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">SELECT BED STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="AVAILABLE">AVAILABLE (🟢 Free for booking)</option>
                  <option value="OCCUPIED">OCCUPIED (👤 Assigned to resident)</option>
                  <option value="RESERVED">RESERVED (📌 Advance booking)</option>
                  <option value="HOLD">HOLD (🟠 Temporarily on hold)</option>
                  <option value="MAINTENANCE">MAINTENANCE (🔧 Repair work)</option>
                  <option value="BLOCKED">BLOCKED (🔴 Out of service)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">AUDIT NOTES</label>
                <input
                  type="text"
                  placeholder="Reason or description for status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateHold} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">HOLD REASON</label>
                <select
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="MAINTENANCE">MAINTENANCE (Deep Cleaning / Painting)</option>
                  <option value="VIP_BOOKING">VIP BOOKING (Reserved for Corporate Client)</option>
                  <option value="RESERVED">RESERVED (Advance token paid)</option>
                  <option value="CLEANING">CLEANING (Sanitization)</option>
                  <option value="BLOCKED">BLOCKED (Physical damage / lock issue)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">START DATE</label>
                  <input
                    type="date"
                    value={holdStartDate}
                    onChange={(e) => setHoldStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">END DATE</label>
                  <input
                    type="date"
                    value={holdEndDate}
                    onChange={(e) => setHoldEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">HOLD NOTES</label>
                <input
                  type="text"
                  placeholder="Notes for housekeeping or staff..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Hold...' : 'Place On Hold'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
