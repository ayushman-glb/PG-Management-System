import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ShieldCheck, CheckCircle2, PenTool, AlertTriangle, RefreshCw, Ban } from "lucide-react";
import { SignatureCanvas } from "@components/SignatureCanvas";
import { DownloadPermissionModal } from "@components/DownloadPermissionModal";
import { useTheme } from "@theme/index";
import { agreementService } from "@services/agreement.service";
import { useDocumentDownload } from "@hooks/useDocumentDownload";
import { SignatureType } from "../../../types/Agreement";

interface AgreementViewerModalProps {
  agreement: any;
  onClose: () => void;
  onSignComplete?: (updatedAgreement: any) => void;
}

export const AgreementViewerModal: React.FC<AgreementViewerModalProps> = ({
  agreement,
  onClose,
  onSignComplete,
}) => {
  const [showSignPad, setShowSignPad] = useState(false);
  const [signerRole, setSignerRole] = useState<"RESIDENT" | "OWNER">("RESIDENT");
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [showResignPrompt, setShowResignPrompt] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const { darkMode } = useTheme();
  const { download, isDownloading, getError } = useDocumentDownload();

  React.useEffect(() => {
    const lenis = (window as any).__lenis;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, []);

  if (!agreement) return null;

  const residentName = agreement.resident?.profile
    ? `${agreement.resident.profile.firstName || ''} ${agreement.resident.profile.lastName || ''}`.trim() || agreement.resident?.name || agreement.resident?.username || "Resident"
    : agreement.resident?.name || agreement.resident?.username || "Resident";

  const ownerName = agreement.owner?.profile
    ? `${agreement.owner.profile.firstName || ''} ${agreement.owner.profile.lastName || ''}`.trim() || agreement.owner?.name || agreement.owner?.username || "Property Owner"
    : agreement.owner?.name || agreement.owner?.username || "Property Owner";

  const propertyName = agreement.pg?.name || "RoomBae PG Property";
  const propertyAddress = agreement.pg?.location
    ? `${agreement.pg.location.address || ''}, ${agreement.pg.location.city || ''} - ${agreement.pg.location.pincode || ''}`
    : agreement.pg?.address || "Bengaluru, Karnataka";

  const roomNumber = agreement.allocation?.room?.roomNumber || agreement.roomNumber || agreement.room?.roomNumber || "—";
  const bedNumber = agreement.allocation?.bed?.bedNumber || agreement.bedNumber || agreement.bed?.bedNumber || "—";
  const roomType = agreement.allocation?.room?.roomType || agreement.roomType || "Standard";

  const rentAmount = Number(agreement.rentAmount || 0);
  const depositAmount = Number(agreement.depositAmount || 0);

  const hasResidentSignature = agreement.signatures?.some(
    (s: any) => s.signerRole === "RESIDENT" || s.signerType === "RESIDENT"
  );
  const hasOwnerSignature = agreement.signatures?.some(
    (s: any) => s.signerRole === "PG_OWNER" || s.signerType === "OWNER"
  );

  const handleInitiateSign = (role: "RESIDENT" | "OWNER") => {
    setSignerRole(role);
    setSignError(null);

    const alreadySigned = role === "RESIDENT" ? hasResidentSignature : hasOwnerSignature;
    if (alreadySigned) {
      setShowResignPrompt(true);
    } else {
      setIsOverrideMode(false);
      setShowSignPad(true);
    }
  };

  const handleConfirmOverride = () => {
    setShowResignPrompt(false);
    setIsOverrideMode(true);
    setShowSignPad(true);
  };

  const handleDiscardResign = () => {
    setShowResignPrompt(false);
    setIsOverrideMode(false);
    setSignError(null);
  };

  const handleSaveSignature = async (payload: {
    signatureType: SignatureType;
    signatureData: string;
    consent: boolean;
  }) => {
    try {
      setIsSigning(true);
      setSignError(null);

      const updated = await agreementService.signAgreement(agreement.id, {
        signatureType: payload.signatureType,
        signatureData: payload.signatureData,
        consent: payload.consent,
        override: isOverrideMode,
      });

      onSignComplete?.(updated);
      setShowSignPad(false);
      setIsOverrideMode(false);
    } catch (e: any) {
      console.error("Signature signing error:", e);
      if (e.message?.includes("already digitally signed")) {
        setShowSignPad(false);
        setShowResignPrompt(true);
      } else {
        setSignError(e.message || "Failed to submit digital signature. Please try again.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleConfirmDownload = async () => {
    setShowDownloadModal(false);
    await download({
      entityId: agreement.id,
      documentType: 'SIGNED_AGREEMENT',
      fileName: `RoomBae-Agreement-${agreement.agreementNumber || agreement.id}.pdf`,
    });
  };

  const modalBg = darkMode
    ? "bg-neutral-900 border-white/10 text-white shadow-2xl"
    : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)] shadow-2xl";
  const headerBg = darkMode
    ? "bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10"
    : "bg-gradient-to-r from-[#f7f7f7] via-[#ffffff] to-[#ffffff] border-b border-[var(--border-main)]";
  const cardBg = darkMode
    ? "bg-neutral-950 border-white/10 text-neutral-300"
    : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)]";
  const subCardBg = darkMode
    ? "bg-neutral-900 border-white/10 text-neutral-300"
    : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)]";
  const textPrimary = darkMode ? "text-white" : "text-[var(--text-main)]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[var(--text-muted)]";
  const accentText = darkMode ? "text-amber-400" : "text-[var(--brand-primary)]";

  const agreementFileName = `RoomBae-Agreement-${agreement.agreementNumber || agreement.id}.pdf`;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        data-lenis-prevent
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border flex flex-col ${modalBg}`}
          data-lenis-prevent
        >
          <div className={`relative p-6 flex justify-between items-center ${headerBg}`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all cursor-pointer ${
                darkMode
                  ? "bg-white/10 text-neutral-400 hover:text-white"
                  : "bg-[var(--bg-nested)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-extrabold ${textPrimary}`}>
                  Model Residential PG Lease Agreement
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {agreement.status || "PENDING"}
                </span>
              </div>
              <p className={`text-xs ${textMuted} mt-1`}>
                Agreement Code:{" "}
                <strong className={accentText}>
                  {agreement.agreementNumber || "RMB-AGR-2026-001"}
                </strong>{" "}
                • Indian Tenancy Contract Standard
              </p>
            </div>

            <div className="flex items-center gap-3 pr-10">
              <div className="relative">
                <button
                  type="button"
                  disabled={isDownloading(agreement.id, 'SIGNED_AGREEMENT')}
                  onClick={() => setShowDownloadModal(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all disabled:opacity-50 ${
                    darkMode
                      ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                      : "bg-[var(--brand-primary)] text-black hover:bg-[var(--brand-primary)] hover:text-white border-[var(--brand-primary)]"
                  }`}
                >
                  <Download
                    className={`w-4 h-4 ${darkMode ? "text-amber-400" : "text-black"} ${
                      isDownloading(agreement.id, 'SIGNED_AGREEMENT') ? 'animate-spin' : ''
                    }`}
                  />{" "}
                  {isDownloading(agreement.id, 'SIGNED_AGREEMENT') ? "Generating PDF..." : "Download PDF"}
                </button>
                {getError(agreement.id, 'SIGNED_AGREEMENT') && (
                  <div className="absolute -bottom-5 left-0 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Download failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="p-6 overflow-y-auto flex-1 space-y-6 text-xs leading-relaxed"
            data-lenis-prevent
          >
            {signError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {signError}
              </div>
            )}

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                darkMode
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : "bg-[#F4E7DA] border-[var(--brand-primary)]/40 text-[var(--text-main)]"
              }`}
            >
              <ShieldCheck className={`w-6 h-6 flex-shrink-0 ${accentText}`} />
              <div>
                <p className={`font-semibold ${textPrimary}`}>
                  Digitally Executed under Indian Contract Act 1872 &amp; IT Act 2000
                </p>
                <p className={`text-xs ${textMuted}`}>
                  Contains SHA-256 cryptographic signature timestamps and public QR verification code.
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>
                1. PARTIES TO THIS LEASE AGREEMENT
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`font-semibold ${textPrimary}`}>LESSOR / OWNER:</p>
                  <p className={textPrimary}>{ownerName}</p>
                  <p className={textMuted}>Email: {agreement.owner?.email || "—"}</p>
                  <p className={textMuted}>Contact: {agreement.owner?.phone || "+91 98765 43210"}</p>
                </div>
                <div>
                  <p className={`font-semibold ${textPrimary}`}>LESSEE / RESIDENT:</p>
                  <p className={textPrimary}>{residentName}</p>
                  <p className={textMuted}>Email: {agreement.resident?.email || "—"}</p>
                  <p className={textMuted}>Contact: {agreement.resident?.phone || "+91 98765 43210"}</p>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>
                2. PREMISES &amp; FINANCIAL OBLIGATIONS
              </h4>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${textPrimary}`}>
                <p>
                  • Assigned PG Property: <strong className={textPrimary}>{propertyName}</strong>
                </p>
                <p>
                  • Room &amp; Bed:{" "}
                  <strong className={accentText}>
                    Room {roomNumber} · Bed {bedNumber} ({roomType})
                  </strong>
                </p>
                <p>
                  • Monthly License Fee (Rent):{" "}
                  <strong className={textPrimary}>
                    ₹{rentAmount.toLocaleString('en-IN')} / month
                  </strong>{" "}
                  (Payable on or before 5th)
                </p>
                <p>
                  • Refundable Security Deposit:{" "}
                  <strong className={textPrimary}>
                    ₹{depositAmount.toLocaleString('en-IN')}
                  </strong>
                </p>
                <p>
                  • Lock-in Period:{" "}
                  <strong className={textPrimary}>
                    {agreement.lockInPeriodMonths || 3} Months
                  </strong>
                </p>
                <p>
                  • Notice Period:{" "}
                  <strong className={accentText}>
                    {agreement.noticePeriodDays || 30} Days Written Notice
                  </strong>
                </p>
                <p className="md:col-span-2 text-slate-400">
                  • Property Address: {propertyAddress}
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>
                3. HOUSE RULES, CURFEW &amp; CODE OF CONDUCT
              </h4>
              <div className={`space-y-2 ${textPrimary}`}>
                <p>
                  • <strong>Curfew &amp; Security:</strong> Main gate closing hours 10:30 PM. Digital entry log maintained.
                </p>
                <p>
                  • <strong>Visitor Policy:</strong> Visitors permitted in common lounge between 09:00 AM - 08:00 PM with visitor pass.
                </p>
                <p>
                  • <strong>Damage Liability:</strong> Tenant is liable for any damage to room inventory and fixtures.
                </p>
                <p>
                  • <strong>Termination:</strong> Either party may terminate with written notice as defined in the terms.
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${cardBg} border-amber-500/30`}>
              <div className="flex justify-between items-center">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${accentText} flex items-center gap-2`}>
                  <PenTool className="w-4 h-4" /> Cryptographic Signatures Status
                </h4>
                {!showSignPad && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInitiateSign("RESIDENT")}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 cursor-pointer transition-colors"
                    >
                      {hasResidentSignature ? "Re-Sign as Resident ✍️" : "Sign as Resident ✍️"}
                    </button>
                    <button
                      onClick={() => handleInitiateSign("OWNER")}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 cursor-pointer transition-colors"
                    >
                      {hasOwnerSignature ? "Re-Sign as Owner ✍️" : "Sign as Owner ✍️"}
                    </button>
                  </div>
                )}
              </div>

              {/* Re-signing options modal / prompt */}
              {showResignPrompt && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    darkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#FDF3EB] border-[var(--brand-primary)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-500">Signature Already Registered</p>
                      <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-[#54423A]'}`}>
                        You have already digitally signed this lease agreement. How would you like to proceed?
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmOverride}
                      className="py-1.5 px-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Option 1: Override Previous Signature
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardResign}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        darkMode
                          ? 'border-white/10 hover:bg-white/10 text-neutral-300'
                          : 'border-[var(--border-main)] bg-white text-[var(--text-muted)] hover:bg-neutral-50'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      Option 2: Discard Recent Sign &amp; Keep Existing
                    </button>
                  </div>
                </div>
              )}

              {showSignPad ? (
                <div className="space-y-2">
                  {isSigning && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Applying electronic signature ({isOverrideMode ? 'Overriding' : 'Registering'}) and computing document hash...
                    </div>
                  )}
                  <SignatureCanvas
                    signerName={signerRole === "RESIDENT" ? residentName : ownerName}
                    signerType={signerRole}
                    onSaveSignature={handleSaveSignature}
                    onCancel={() => {
                      setShowSignPad(false);
                      setIsOverrideMode(false);
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border space-y-2 ${subCardBg}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                      RESIDENT SIGNATURE
                    </p>
                    {hasResidentSignature ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed &amp; Verified
                        </span>
                        <p className={`text-xs ${textMuted}`}>
                          {residentName} • Digitally Executed
                        </p>
                      </div>
                    ) : (
                      <p className={`text-xs ${accentText} font-medium`}>
                        ⏳ Signature Pending
                      </p>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 ${subCardBg}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                      OWNER / LESSOR SIGNATURE
                    </p>
                    {hasOwnerSignature ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed &amp; Stamp Verified
                        </span>
                        <p className={`text-xs ${textMuted}`}>
                          {ownerName} • Authorized Signatory
                        </p>
                      </div>
                    ) : (
                      <p className={`text-xs ${accentText} font-medium`}>
                        ⏳ Signature Pending
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Storage & Download Permission Modal */}
      <DownloadPermissionModal
        isOpen={showDownloadModal}
        fileName={agreementFileName}
        documentTitle={`Model Lease Agreement — ${agreement.agreementNumber || 'RMB-AGR'}`}
        documentType="Adobe PDF (.pdf)"
        isDownloading={isDownloading(agreement.id, 'SIGNED_AGREEMENT')}
        onConfirm={handleConfirmDownload}
        onDeny={() => setShowDownloadModal(false)}
      />
    </AnimatePresence>
  );
};
