import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, ShieldCheck, CheckCircle2, PenTool
} from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';

interface AgreementViewerModalProps {
  agreement: any;
  onClose: () => void;
  onSignComplete?: (updatedAgreement: any) => void;
}

export const AgreementViewerModal: React.FC<AgreementViewerModalProps> = ({
  agreement,
  onClose,
  onSignComplete
}) => {
  const [showSignPad, setShowSignPad] = useState(false);
  const [signerType, setSignerType] = useState<'RESIDENT' | 'OWNER'>('RESIDENT');

  React.useEffect(() => {
    // Stop background Lenis smooth scroll while modal is open
    const lenis = (window as any).__lenis;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, []);

  if (!agreement) return null;

  const handleSaveSignature = async (signatureSvg: string, type: 'RESIDENT' | 'OWNER') => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/agreements/${agreement.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerType: type,
          signerName: type === 'RESIDENT' ? (agreement.resident?.name || 'Rahul Sharma') : (agreement.owner?.name || 'Rajesh Kumar'),
          signatureDataSvg: signatureSvg
        })
      });
      const json = await res.json();
      if (json.success) {
        onSignComplete?.(json.data.agreement);
        setShowSignPad(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`http://localhost:5000/api/v1/agreements/${agreement.id}/pdf`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col"
          data-lenis-prevent
        >
          {/* Top Header */}
          <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10 flex justify-between items-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white">Model Residential PG Lease Agreement</h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {agreement.status || 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Agreement Code: <strong className="text-amber-400">{agreement.agreementNumber || 'RMB-AGR-2026-001'}</strong> • Indian Legal Contract Standard
              </p>
            </div>

            <div className="flex items-center gap-3 pr-10">
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" /> Download PDF
              </button>
            </div>
          </div>

          {/* Legal Contract Document Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-neutral-300 text-xs leading-relaxed" data-lenis-prevent>
            {/* Header Stamp Note */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 flex-shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold">Digitally Executed under Indian Contract Act 1872 & IT Act 2000</p>
                <p className="text-[11px] text-neutral-400">Contains HMAC SHA-256 cryptographic signature timestamps and QR verification hash.</p>
              </div>
            </div>

            {/* Section 1: Contracting Parties */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">1. PARTIES TO THIS LEASE AGREEMENT</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-white">LESSOR / OWNER:</p>
                  <p>{agreement.owner?.name || 'Rajesh Kumar'}</p>
                  <p className="text-neutral-400">Address: {agreement.owner?.address || 'Indiranagar, Bengaluru'}</p>
                  <p className="text-neutral-400">Contact: {agreement.owner?.phone || '+91 98765 43210'}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">LESSEE / RESIDENT:</p>
                  <p>{agreement.resident?.name || 'Rahul Sharma'}</p>
                  <p className="text-neutral-400">Permanent Address: {agreement.resident?.permanentAddress || 'New Delhi'}</p>
                  <p className="text-neutral-400">Contact: {agreement.resident?.phone || '+91 98765 43210'}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Property & Financial Terms */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. PREMISES & FINANCIAL OBLIGATIONS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-300">
                <p>• Assigned PG Property: <strong className="text-white">{agreement.pg?.name || 'RoomBae Indiranagar Luxe'}</strong></p>
                <p>• Room & Bed Inventory: <strong className="text-amber-400">Room {agreement.roomNumber || '101'} (Bed {agreement.bedNumber || '101-A'})</strong></p>
                <p>• Monthly License Fee (Rent): <strong className="text-white">₹{agreement.rentAmount || '8,500'} / month</strong> (Due by 5th)</p>
                <p>• Refundable Security Deposit: <strong className="text-white">₹{agreement.securityDeposit || '17,000'}</strong></p>
                <p>• Monthly Maintenance Charges: <strong className="text-white">₹{agreement.maintenanceCharges || '500'} / month</strong></p>
                <p>• Notice Period Requirements: <strong className="text-amber-400">{agreement.noticePeriodDays || 30} Days Written Notice</strong></p>
              </div>
            </div>

            {/* Section 3: House Rules, Curfew & Prohibitions */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">3. HOUSE RULES, CURFEW & CODE OF CONDUCT</h4>
              <div className="space-y-2 text-neutral-300">
                <p>• <strong>Curfew & Security:</strong> {agreement.curfewTime || '10:30 PM main gate lock time'}. Biometric access logs recorded.</p>
                <p>• <strong>Visitor Policy:</strong> {agreement.visitorPolicy || 'Visitors permitted in common ground lobby till 8:00 PM'}. Overnight stay strictly prohibited without prior written permission.</p>
                <p>• <strong>Prohibited Conduct:</strong> Strictly No Smoking, Alcohol, illegal substances, or unauthorized sub-letting allowed inside the premises.</p>
                <p>• <strong>Damage & Repairs:</strong> {agreement.damagePolicy || 'Resident is liable for any physical structural damage caused to room fixtures, AC, or bed frames.'}</p>
                <p>• <strong>Termination & Dispute Jurisdiction:</strong> Agreement terminable by either party with 30-day prior written notice. Disputes subject to local City Civil Courts under Indian Contract Act 1872.</p>
              </div>
            </div>

            {/* Signatures Display & Signature Canvas Box */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <PenTool className="w-4 h-4" /> Cryptographic Signatures Status
                </h4>
                {!showSignPad && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSignerType('RESIDENT'); setShowSignPad(true); }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30"
                    >
                      Sign as Resident ✍️
                    </button>
                    <button
                      onClick={() => { setSignerType('OWNER'); setShowSignPad(true); }}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30"
                    >
                      Sign as Owner ✍️
                    </button>
                  </div>
                )}
              </div>

              {showSignPad ? (
                <SignatureCanvas
                  signerName={signerType === 'RESIDENT' ? (agreement.resident?.name || 'Rahul Sharma') : (agreement.owner?.name || 'Rajesh Kumar')}
                  signerType={signerType}
                  onSaveSignature={handleSaveSignature}
                  onCancel={() => setShowSignPad(false)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-neutral-900 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">RESIDENT SIGNATURE</p>
                    {agreement.signatures?.some((s: any) => s.signerType === 'RESIDENT') ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed & Verified
                        </span>
                        <p className="text-[10px] text-neutral-400">HMAC SHA-256 Validated</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400 font-medium">⏳ Signature Pending</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-neutral-900 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">OWNER / LESSOR SIGNATURE</p>
                    {agreement.signatures?.some((s: any) => s.signerType === 'OWNER') ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed & Stamp Verified
                        </span>
                        <p className="text-[10px] text-neutral-400">Digital Stamp Timestamped</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400 font-medium">⏳ Signature Pending</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
