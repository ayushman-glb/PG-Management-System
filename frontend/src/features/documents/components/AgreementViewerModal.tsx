import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ShieldCheck, CheckCircle2, PenTool, AlertTriangle } from "lucide-react";
import { SignatureCanvas } from "@components/SignatureCanvas";
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
    ? `${agreement.resident.profile.firstName} ${agreement.resident.profile.lastName}`.trim()
    : agreement.resident?.name || agreement.resident?.username || "Resident";

  const ownerName = agreement.owner?.profile
    ? `${agreement.owner.profile.firstName} ${agreement.owner.profile.lastName}`.trim()
    : agreement.owner?.name || agreement.owner?.username || "Property Owner";

  const propertyName = agreement.pg?.name || "RoomBae PG Property";
  const propertyAddress = agreement.pg?.location
    ? `${agreement.pg.location.address}, ${agreement.pg.location.city} - ${agreement.pg.location.pincode}`
    : agreement.pg?.address || "Bengaluru, Karnataka";

  const roomNumber = agreement.allocation?.room?.roomNumber || agreement.roomNumber || agreement.room?.roomNumber || "—";
  const bedNumber = agreement.allocation?.bed?.bedNumber || agreement.bedNumber || agreement.bed?.bedNumber || "—";
  const roomType = agreement.allocation?.room?.roomType || agreement.roomType || "Standard";

  const rentAmount = Number(agreement.rentAmount || 0);
  const depositAmount = Number(agreement.depositAmount || 0);

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
      });

      onSignComplete?.(updated);
      setShowSignPad(false);
    } catch (e: any) {
      console.error("Signature signing error:", e);
      setSignError(e.message || "Failed to submit digital signature. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const modalBg = darkMode
    ? "bg-neutral-900 border-white/10 text-white shadow-2xl"
    : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] shadow-2xl";
  const headerBg = darkMode
    ? "bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10"
    : "bg-gradient-to-r from-[#F8EEE5] via-[#FFFDFB] to-[#FFFDFB] border-b border-[#E6D7CA]";
  const cardBg = darkMode
    ? "bg-neutral-950 border-white/10 text-neutral-300"
    : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]";
  const subCardBg = darkMode
    ? "bg-neutral-900 border-white/10 text-neutral-300"
    : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]";
  const textPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";
  const accentText = darkMode ? "text-amber-400" : "text-[#C58B63]";

  const hasResidentSignature = agreement.signatures?.some(
    (s: any) => s.signerRole === "RESIDENT" || s.signerType === "RESIDENT"
  );
  const hasOwnerSignature = agreement.signatures?.some(
    (s: any) => s.signerRole === "PG_OWNER" || s.signerType === "OWNER"
  );

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
                  : "bg-[#E6D7CA]/40 text-[#6E5A52] hover:text-[#3B2A24]"
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
                  onClick={() =>
                    download({
                      entityId: agreement.id,
                      documentType: 'SIGNED_AGREEMENT',
                      fileName: `RoomBae-Agreement-${agreement.agreementNumber || agreement.id}.pdf`,
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all disabled:opacity-50 ${
                    darkMode
                      ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                      : "bg-[#D9A87C] text-black hover:bg-[#C58B63] hover:text-white border-[#D9A87C]"
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
                    <span className="text-[10px] text-red-400">Download failed</span>
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
                  : "bg-[#F4E7DA] border-[#D9A87C]/40 text-[#3B2A24]"
              }`}
            >
              <ShieldCheck className={`w-6 h-6 flex-shrink-0 ${accentText}`} />
              <div>
                <p className={`font-semibold ${textPrimary}`}>
                  Digitally Executed under Indian Contract Act 1872 &amp; IT Act 2000
                </p>
                <p className={`text-[11px] ${textMuted}`}>
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
                      onClick={() => {
                        setSignerRole("RESIDENT");
                        setShowSignPad(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
                    >
                      Sign as Resident ✍️
                    </button>
                    <button
                      onClick={() => {
                        setSignerRole("OWNER");
                        setShowSignPad(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 cursor-pointer"
                    >
                      Sign as Owner ✍️
                    </button>
                  </div>
                )}
              </div>

              {showSignPad ? (
                <div className="space-y-2">
                  {isSigning && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      Applying electronic signature and computing document hash...
                    </div>
                  )}
                  <SignatureCanvas
                    signerName={signerRole === "RESIDENT" ? residentName : ownerName}
                    signerType={signerRole}
                    onSaveSignature={handleSaveSignature}
                    onCancel={() => setShowSignPad(false)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border space-y-2 ${subCardBg}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
                      RESIDENT SIGNATURE
                    </p>
                    {hasResidentSignature ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed &amp; Verified
                        </span>
                        <p className={`text-[10px] ${textMuted}`}>
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
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
                      OWNER / LESSOR SIGNATURE
                    </p>
                    {hasOwnerSignature ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Signed &amp; Stamp Verified
                        </span>
                        <p className={`text-[10px] ${textMuted}`}>
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
    </AnimatePresence>
  );
};
