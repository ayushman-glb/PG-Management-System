import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, XCircle, Bed, AlertTriangle } from 'lucide-react';

import { api } from '../services/api';

interface RoomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'resident-request' | 'owner-action';
  residentData?: {
    id: string;
    name: string;
    pgId: string;
    currentBedId: string;
    roomNumber?: string;
    bedNumber?: string;
  };
  requestData?: any;
  onSuccess?: () => void;
}

export const RoomTransferModal: React.FC<RoomTransferModalProps> = ({
  isOpen,
  onClose,
  mode,
  residentData,
  requestData,
  onSuccess
}) => {
  const [preferredSharingType, setPreferredSharingType] = useState('Single Sharing');
  const [preferredRoomNumber, setPreferredRoomNumber] = useState('');
  const [reason, setReason] = useState('');
  const [budget, setBudget] = useState('9500');
  const [preferredMoveDate, setPreferredMoveDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [targetBedId, setTargetBedId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentData?.id || !residentData?.pgId || !residentData?.currentBedId) {
      setFeedback({ type: 'error', message: 'Missing resident profile details' });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ type: 'error', message: 'Please state the reason for your room change request' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createRoomTransferRequest({
        residentId: residentData.id,
        pgId: residentData.pgId,
        currentBedId: residentData.currentBedId,
        preferredSharingType,
        preferredRoomNumber: preferredRoomNumber || undefined,
        reason,
        budget: parseFloat(budget) || undefined,
        preferredMoveDate: preferredMoveDate || undefined,
        additionalNotes: additionalNotes || undefined,
        priority
      });
      setFeedback({ type: 'success', message: 'Room change request submitted successfully!' });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerApprove = async () => {
    if (!requestData?.id) return;
    setIsSubmitting(true);
    try {
      await api.approveRoomTransfer(requestData.id, targetBedId || undefined, undefined, additionalNotes);
      setFeedback({ type: 'success', message: 'Room transfer request approved!' });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerReject = async () => {
    if (!requestData?.id) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a rejection reason' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.rejectRoomTransfer(requestData.id, rejectionReason);
      setFeedback({ type: 'success', message: 'Room transfer request rejected.' });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerComplete = async () => {
    if (!requestData?.id) return;
    setIsSubmitting(true);
    try {
      await api.completeRoomTransfer(requestData.id);
      setFeedback({ type: 'success', message: 'Room transfer completed & resident reassigned!' });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Transfer completion failed' });
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
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 p-6 text-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bed className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {mode === 'resident-request' ? 'Request Room Change' : 'Manage Room Transfer Request'}
                </h3>
                <p className="text-sm text-neutral-400">
                  {mode === 'resident-request'
                    ? 'Submit your room or bed transfer preferences to property owner'
                    : `Request from ${requestData?.resident?.name || 'Resident'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Form / Content */}
          {mode === 'resident-request' ? (
            <form onSubmit={handleResidentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">PREFERRED SHARING TYPE</label>
                  <select
                    value={preferredSharingType}
                    onChange={(e) => setPreferredSharingType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Single Sharing">Single Sharing (1 Bed)</option>
                    <option value="2 Sharing">2 Sharing (Double)</option>
                    <option value="3 Sharing">3 Sharing (Triple)</option>
                    <option value="Deluxe Suite">Deluxe Private Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">PREFERRED ROOM # (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204 or Single AC"
                    value={preferredRoomNumber}
                    onChange={(e) => setPreferredRoomNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">MONTHLY BUDGET (₹)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">PREFERRED MOVE DATE</label>
                  <input
                    type="date"
                    value={preferredMoveDate}
                    onChange={(e) => setPreferredMoveDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">PRIORITY LEVEL</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">REASON FOR ROOM CHANGE *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why you want to change room (e.g. Quiet environment for studies, closer to AC, roommate change)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">ADDITIONAL NOTES</label>
                <input
                  type="text"
                  placeholder="Any specific requests for owner..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Owner Action View */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-800/60 border border-white/5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Resident Name:</span>
                  <span className="font-semibold text-white">{requestData?.resident?.name || 'Rahul Sharma'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Current Bed:</span>
                  <span className="font-medium text-amber-400">{requestData?.currentBed?.bedNumber || 'Room 101-A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Preferred Sharing:</span>
                  <span className="font-medium text-emerald-400">{requestData?.preferredSharingType || 'Single Sharing'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Reason:</span>
                  <span className="italic text-neutral-300">"{requestData?.reason || 'Seeking single occupancy'}"</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">ASSIGN TARGET BED ID (FOR APPROVAL)</label>
                <input
                  type="text"
                  placeholder="Enter target Bed ID (e.g. bed_204_a)"
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">REJECTION REASON (IF REJECTING)</label>
                <input
                  type="text"
                  placeholder="Specify why request cannot be fulfilled..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap justify-end gap-3">
                <button
                  onClick={handleOwnerReject}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium hover:bg-rose-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Request
                </button>

                <button
                  onClick={handleOwnerApprove}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Request
                </button>

                <button
                  onClick={handleOwnerComplete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Complete Transfer
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
