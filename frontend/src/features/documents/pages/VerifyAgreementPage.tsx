import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Search, Building, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../../theme';
import { agreementService } from '../../../services/agreement.service';
import { AgreementVerificationData } from '../../../types/Agreement';
import { Logo } from '../../../components/ui/Logo';

interface Props {
  navigate?: (page: any) => void;
}

export const VerifyAgreementPage: React.FC<Props> = ({ navigate }) => {
  const [agreementCode, setAgreementCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgreementVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const num = urlParams.get('num') || urlParams.get('code');
    if (num) {
      setAgreementCode(num);
      verify(num);
    }
  }, []);

  const verify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await agreementService.verifyAgreement(codeToVerify.trim());
      setResult(data as AgreementVerificationData);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'No valid agreement record found for the provided code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify(agreementCode);
  };

  const containerBg = darkMode ? "bg-[var(--bg-primary)] text-[var(--text-main)]" : "bg-[var(--bg-primary)] text-[var(--text-main)]";
  const cardBg = darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-[var(--bg-primary)] border-[var(--border-main)]";

  return (
    <div className={`min-h-screen flex flex-col ${containerBg}`}>
      {/* Header */}
      <header className={`px-6 py-4 border-b flex justify-between items-center ${
        darkMode ? "bg-[var(--bg-nested)]/80 border-[var(--border-main)]" : "bg-[var(--bg-primary)]/80 border-[var(--border-main)]"
      }`}>
        <div className="flex items-center gap-3">
          {navigate && (
            <button
              onClick={() => navigate('landing')}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo />
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Public Contract Verifier
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black">Verify Digital Lease Agreement</h1>
          <p className="text-xs md:text-sm text-neutral-400">
            Authenticate the cryptographic integrity and validity of any RoomBae digital rental agreement.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSubmit} className={`p-4 rounded-3xl border shadow-xl flex gap-2 ${cardBg}`}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={agreementCode}
              onChange={(e) => setAgreementCode(e.target.value)}
              placeholder="e.g. AGR-AURORA-1001 or RMB-AGR-2026-XXXX"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-950/40 border border-white/10 text-xs md:text-sm font-mono uppercase focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !agreementCode.trim()}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {/* Verification Result */}
        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" /> Agreement Record Not Found
            </div>
            <p className="text-xs text-red-300/80 leading-relaxed">
              {error} Please double-check the agreement code from your printed contract or scan the QR code again.
            </p>
          </div>
        )}

        {result && (
          <div className={`p-6 md:p-8 rounded-3xl border shadow-2xl space-y-6 animate-fade-in ${cardBg}`}>
            {/* Status Banner */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg">Cryptographically Validated</h3>
                  <p className="text-xs text-neutral-400">Authentic Tenancy Contract registered on RoomBae</p>
                </div>
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {result.status}
              </span>
            </div>

            {/* Contract Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" /> Contract Identification
                </span>
                <p><strong className="text-neutral-400">Agreement Code:</strong> <span className="font-mono text-amber-400">{result.agreementNumber}</span></p>
                <p><strong className="text-neutral-400">Version:</strong> v{result.version}.0 (Active)</p>
                <p><strong className="text-neutral-400">Execution Status:</strong> {result.status}</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" /> Property Premises
                </span>
                <p><strong className="text-neutral-400">Property:</strong> {result.propertyName}</p>
                <p><strong className="text-neutral-400">Location:</strong> {result.propertyAddress || 'Bengaluru, India'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Contracting Parties
                </span>
                <p><strong className="text-neutral-400">Lessor (Owner):</strong> {result.ownerName}</p>
                <p><strong className="text-neutral-400">Lessee (Resident):</strong> {result.residentName}</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Term &amp; Financials
                </span>
                <p><strong className="text-neutral-400">Duration:</strong> {new Date(result.startDate).toLocaleDateString('en-IN')} to {new Date(result.endDate).toLocaleDateString('en-IN')}</p>
                <p><strong className="text-neutral-400">Monthly Rent:</strong> ₹{Number(result.monthlyRent || 0).toLocaleString('en-IN')}</p>
                <p><strong className="text-neutral-400">Deposit:</strong> ₹{Number(result.securityDeposit || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Cryptographic Signatures */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Digital Signatures Timestamp ({result.signaturesCount} Recorded)
              </h4>
              <div className="space-y-1.5 text-xs text-neutral-300">
                {result.signatures.map((sig, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="font-semibold text-emerald-400">✔ {sig.role} Signature</span>
                    <span className="text-neutral-400 font-mono text-xs">{new Date(sig.signedAt).toISOString()} ({sig.type})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hash Footprint */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs text-neutral-500 font-mono">
              <span>SHA-256: {result.documentHash || 'Generated on document completion'}</span>
              <span>Verified at: {new Date(result.verifiedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default VerifyAgreementPage;
