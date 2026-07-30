import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, ShieldCheck, CheckCircle2, PenTool
} from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { useTheme } from '../theme';

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
  const { darkMode } = useTheme();

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

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white shadow-2xl" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] shadow-2xl";
  const headerBg = darkMode
    ? "bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10"
    : "bg-gradient-to-r from-[#F8EEE5] via-[#FFFDFB] to-[#FFFDFB] border-b border-[#E6D7CA]";
  const cardBg = darkMode ? "bg-neutral-950 border-white/10 text-neutral-300" : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]";
  const subCardBg = darkMode ? "bg-neutral-900 border-white/10 text-neutral-300" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]";
  const textPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";
  const accentText = darkMode ? "text-amber-400" : "text-[#C58B63]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border flex flex-col ${modalBg}`}
          data-lenis-prevent
        >
          {/* Top Header */}
          <div className={`relative p-6 flex justify-between items-center ${headerBg}`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all cursor-pointer ${
                darkMode ? "bg-white/10 text-neutral-400 hover:text-white" : "bg-[#E6D7CA]/40 text-[#6E5A52] hover:text-[#3B2A24]"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-extrabold ${textPrimary}`}>Model Residential PG Lease Agreement</h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {agreement.status || 'PENDING'}
                </span>
              </div>
              <p className={`text-xs ${textMuted} mt-1`}>
                Agreement Code: <strong className={accentText}>{agreement.agreementNumber || 'RMB-AGR-2026-001'}</strong> • Indian Legal Contract Standard
              </p>
            </div>

            <div className="flex items-center gap-3 pr-10">
              <button
                onClick={handleDownloadPdf}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
                  darkMode
                    ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                    : "bg-[#D9A87C] text-black hover:bg-[#C58B63] hover:text-white border-[#D9A87C]"
                }`}
              >
                <Download className={`w-4 h-4 ${darkMode ? "text-amber-400" : "text-black"}`} /> Download PDF
              </button>
            </div>
          </div>

          {/* Legal Contract Document Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs leading-relaxed" data-lenis-prevent>
            {/* Header Stamp Note */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              darkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-[#F4E7DA] border-[#D9A87C]/40 text-[#3B2A24]"
            }`}>
              <ShieldCheck className={`w-6 h-6 flex-shrink-0 ${accentText}`} />
              <div>
                <p className={`font-semibold ${textPrimary}`}>Digitally Executed under Indian Contract Act 1872 & IT Act 2000</p>
                <p className={`text-[11px] ${textMuted}`}>Contains HMAC SHA-256 cryptographic signature timestamps and QR verification hash.</p>
              </div>
            </div>

            {/* Section 1: Contracting Parties */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>1. PARTIES TO THIS LEASE AGREEMENT</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>LESSOR / OWNER:</p>
                  <p className={textPrimary}>{agreement.owner?.name || 'Rajesh Kumar'}</p>
                  <p className={textMuted}>Address: {agreement.owner?.address || 'Indiranagar, Bengaluru'}</p>
                  <p className={textMuted}>Contact: {agreement.owner?.phone || '+91 98765 43210'}</p>
                </div>
                <div>
                  <p className={`font-semibold ${textPrimary}`}>LESSEE / RESIDENT:</p>
                  <p className={textPrimary}>{agreement.resident?.name || 'Rahul Sharma'}</p>
                  <p className={textMuted}>Permanent Address: {agreement.resident?.permanentAddress || 'New Delhi'}</p>
                  <p className={textMuted}>Contact: {agreement.resident?.phone || '+91 98765 43210'}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Property & Financial Terms */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>2. PREMISES & FINANCIAL OBLIGATIONS</h4>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${textPrimary}`}>
                <p>• Assigned PG Property: <strong className={textPrimary}>{agreement.pg?.name || 'RoomBae Indiranagar Luxe'}</strong></p>
                <p>• Room & Bed Inventory: <strong className={accentText}>Room {agreement.roomNumber || '101'} (Bed {agreement.bedNumber || '101-A'})</strong></p>
                <p>• Monthly License Fee (Rent): <strong className={textPrimary}>₹{agreement.rentAmount || '8,500'} / month</strong> (Due by 5th)</p>
                <p>• Refundable Security Deposit: <strong className={textPrimary}>₹{agreement.securityDeposit || '17,000'}</strong></p>
                <p>• Monthly Maintenance Charges: <strong className={textPrimary}>₹{agreement.maintenanceCharges || '500'} / month</strong></p>
                <p>• Notice Period Requirements: <strong className={accentText}>{agreement.noticePeriodDays || 30} Days Written Notice</strong></p>
              </div>
            </div>

            {/* Section 3: House Rules, Curfew & Code of Conduct */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>3. HOUSE RULES, CURFEW & CODE OF CONDUCT</h4>
              <div className={`space-y-2 ${textPrimary}`}>
                <p>• <strong>Curfew & Security:</strong> {agreement.curfewTime || '10:30 PM main gate lock time'}. Biometric access logs recorded.</p>
                <p>• <strong>Visitor Policy:</strong> {agreement.visitorPolicy || 'Visitors permitted in common ground lobby till 8:00 PM'}. Overnight stay strictly prohibited without prior written permission.</p>
                <p>• <strong>Prohibited Conduct:</strong> Strictly No Smoking, Alcohol, illegal substances, or unauthorized sub-letting allowed inside the premises.</p>
                <p>• <strong>Damage & Repairs:</strong> {agreement.damagePolicy || 'Resident is liable for any physical structural damage caused to room fixtures, AC, or bed frames.'}</p>
                <p>• <strong>Termination & Dispute Jurisdiction:</strong> Agreement terminable by either party with 30-day prior written notice. Disputes subject to local City Civil Courts under Indian Contract Act 1872.</p>
              </div>
            </div>

            {/* Signatures Display & Signature Canvas Box */}
            <div className={`p-5 rounded-2xl border space-y-4 ${cardBg} border-amber-500/30`}>
              <div className="flex justify-between items-center">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText} flex items-center gap-2`}>
                  <PenTool className="w-4 h-4" /> Cryptographic Signatures Status
                </h4>
                {!showSignPad && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSignerType('RESIDENT'); setShowSignPad(true); }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
                    >
                      Sign as Resident ✍️
                    </button>
                    <button
                      onClick={() => { setSignerType('OWNER'); setShowSignPad(true); }}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 cursor-pointer"
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
                  <div className={`p-4 rounded-xl border space-y-2 ${subCardBg}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>RESIDENT SIGNATURE</p>
                    {agreement.signatures?.some((s: any) => s.signerType === 'RESIDENT') ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed & Verified
                        </span>
                        <p className={`text-[10px] ${textMuted}`}>HMAC SHA-256 Validated</p>
                      </div>
                    ) : (
                      <p className={`text-xs ${accentText} font-medium`}>⏳ Signature Pending</p>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 ${subCardBg}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>OWNER / LESSOR SIGNATURE</p>
                    {agreement.signatures?.some((s: any) => s.signerType === 'OWNER') ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed & Stamp Verified
                        </span>
                        <p className={`text-[10px] ${textMuted}`}>Digital Stamp Timestamped</p>
                      </div>
                    ) : (
                      <p className={`text-xs ${accentText} font-medium`}>⏳ Signature Pending</p>
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
