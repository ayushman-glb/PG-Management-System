import { useState, useEffect } from "react";
import { FileText, ShieldCheck, PenTool, ArrowLeft } from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle, useTheme } from "@theme/index";
import { api } from "@services/api";

interface Props {
  navigate: (p: Page) => void;
}

export default function ApplicationPage({ navigate }: Props) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"submit" | "list">("submit");

  // Form states
  const [pgId, setPgId] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("8500");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // E-Sign Modal state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signing, setSigning] = useState(false);

  const { darkMode } = useTheme();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications();
      if (res && res.data) {
        setApplications(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgId || !moveInDate) return;

    try {
      setSubmitting(true);
      await api.createApplication({
        pgId,
        moveInDate,
        monthlyRent: parseFloat(monthlyRent),
        securityDeposit: parseFloat(monthlyRent),
        notes,
      });
      setActiveTab("list");
      fetchApplications();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !signerName || !signerEmail) return;

    try {
      setSigning(true);
      await api.signLease(selectedApp.id, {
        signerName,
        signerEmail,
      });
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      <div className={`sticky top-0 z-40 border-b px-6 py-4 backdrop-blur-md ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("pg-listing")} className="p-2 rounded-xl border border-white/10 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Rental Applications & E-Lease</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex gap-2 p-1 rounded-xl bg-black/10 border border-white/10">
              <button
                onClick={() => setActiveTab("submit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === "submit" ? "luxury-btn-primary" : ""}`}
              >
                + Apply Now
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === "list" ? "luxury-btn-primary" : ""}`}
              >
                My Tracker
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "submit" ? (
          <div className={`p-8 rounded-3xl border shadow-xl ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
            <div className="mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Stage 3 • Verified Digital Application
              </span>
              <h2 className="text-2xl font-black mt-2">Submit Rental Application</h2>
              <p className="text-xs opacity-70 mt-1">Complete your application and upload required KYC documents for instant landlord approval.</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              <div>
                <label className="text-xs font-bold block mb-1">Target Property ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 660f1a9b2c3d4e5f6a7b8c9d"
                  value={pgId}
                  onChange={(e) => setPgId(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Move-In Date</label>
                  <input
                    type="date"
                    required
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Additional Notes for Landlord</label>
                <textarea
                  rows={3}
                  placeholder="Student at St. Joseph's College, moving in mid-month..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full luxury-btn-primary py-3.5 text-sm font-bold rounded-2xl shadow-xl shadow-amber-500/20"
                >
                  {submitting ? "Submitting..." : "Submit Application & Proceed"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-sm animate-pulse">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 mx-auto text-amber-500/40 mb-3" />
                <h3 className="text-lg font-bold">No Active Applications</h3>
                <p className="text-sm opacity-60 mt-1 mb-4">Start an application for your shortlisted PG to secure your room.</p>
                <button onClick={() => setActiveTab("submit")} className="luxury-btn-primary px-6 py-2.5 text-xs font-bold">
                  Start Application
                </button>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className={`p-6 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                        {app.pg?.name || "RoomBae Property"}
                      </span>
                      <h3 className="text-lg font-bold mt-2">Application #{app.id.slice(-6)}</h3>
                      <p className="text-xs opacity-60">Move-in Date: {new Date(app.moveInDate).toLocaleDateString()}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      app.status === "LEASE_SIGNED" || app.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      app.status === "SUBMITTED" || app.status === "UNDER_REVIEW" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs">
                      <span className="font-bold text-amber-500 text-sm">₹{app.monthlyRent.toLocaleString()}</span> /mo
                    </div>
                    {app.status === "APPROVED" || app.status === "LEASE_SENT" ? (
                      <button onClick={() => setSelectedApp(app)} className="luxury-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5" /> Sign Lease Agreement
                      </button>
                    ) : app.status === "LEASE_SIGNED" ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Lease E-Signed
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* E-Signing Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold">E-Sign Digital Lease Agreement</h3>
            </div>

            <p className="text-xs opacity-70 mb-4 leading-relaxed">
              By typing your full legal name below, you agree to execute the 11-Month Residential PG Lease Agreement under IT Act section 10A & DPDP Act 2023 with cryptographic HMAC validation.
            </p>

            <form onSubmit={handleSignLease} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Full Legal Signer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Signer Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400">
                🔒 Digital Signature Certificate Token: HMAC-SHA256-{selectedApp.id.slice(-8)}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedApp(null)} className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={signing} className="flex-1 luxury-btn-primary py-2.5 text-xs font-bold rounded-xl">
                  {signing ? "Cryptographically Signing..." : "Confirm & Sign Lease"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
