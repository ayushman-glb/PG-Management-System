import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Loader2 } from "lucide-react";
import { api } from "@services/api";

interface ResidentProfileModalProps {
  residentId: string | null;
  onClose: () => void;
}

export const ResidentProfileModal: React.FC<ResidentProfileModalProps> = ({ residentId, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "timeline" | "documents" | "agreement" | "payments" | "attendance" | "meals" | "complaints" | "gallery"
  >("profile");
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const lenis = (window as any).__lenis;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, []);

  useEffect(() => {
    if (!residentId) return;

    async function fetchResident() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/residents/${residentId}`);
        setResident(res?.data || res);
      } catch (err: any) {
        setError(err.message || "Failed to load resident data");
      } finally {
        setLoading(false);
      }
    }
    fetchResident();
  }, [residentId]);

  if (!residentId) return null;

  if (loading) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" data-lenis-prevent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col"
            data-lenis-prevent
          >
            <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Resident Profile</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (error) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" data-lenis-prevent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col"
            data-lenis-prevent
          >
            <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Resident Profile</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-red-400">Error: {error}</p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (!resident) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" data-lenis-prevent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col"
            data-lenis-prevent
          >
            <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Resident Profile</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-neutral-400">No resident data found.</p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col"
          data-lenis-prevent
        >
          <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5">
              <img
                src={resident.photo || resident.avatar || "https://via.placeholder.com/80"}
                alt={resident.name || "Resident"}
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/50 shadow-xl"
              />
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{resident.name || "—"}</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    🟢 {resident.status || "ACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-medium mt-1">Code: {resident.residentCode || resident.id?.slice(0, 8) || "—"} • Room {resident.roomNumber || "—"} ({resident.bedNumber || "—"})</p>
                <p className="text-xs text-neutral-400 mt-1">{resident.pgName || "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex overflow-x-auto border-b border-white/10 px-6 bg-neutral-950/50">
            {[
              { id: "profile", label: "Profile" },
              { id: "timeline", label: "Timeline" },
              { id: "documents", label: "Documents" },
              { id: "agreement", label: "Agreement" },
              { id: "payments", label: "Payments" },
              { id: "attendance", label: "Attendance" },
              { id: "meals", label: "Meals" },
              { id: "complaints", label: "Complaints" },
              { id: "gallery", label: "Gallery" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Personal Information</h4>
                  <div className="space-y-2 text-xs text-neutral-300">
                    <p><span className="text-neutral-500">Phone:</span> {resident.phone || "—"}</p>
                    <p><span className="text-neutral-500">Email:</span> {resident.email || "—"}</p>
                    <p><span className="text-neutral-500">Gender & Age:</span> {resident.gender || "—"}, {resident.age || "—"} yrs</p>
                    <p><span className="text-neutral-500">Occupation:</span> {resident.occupation || "—"} ({resident.company || "—"})</p>
                    <p><span className="text-neutral-500">Permanent Address:</span> {resident.address || "—"}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Co-Living & Rent Details</h4>
                  <div className="space-y-2 text-xs text-neutral-300">
                    <p><span className="text-neutral-500">Monthly Rent:</span> <strong className="text-white">₹{resident.rentAmount || resident.rent || 0}</strong></p>
                    <p><span className="text-neutral-500">Due Date:</span> {resident.rentDueDate || "—"}</p>
                    <p><span className="text-neutral-500">Move In Date:</span> {resident.moveInDate || "—"}</p>
                    <p><span className="text-neutral-500">Food Preference:</span> <span className="text-emerald-400 font-semibold">{resident.foodPreference || "—"}</span></p>
                    <p><span className="text-neutral-500">Guardian Contact:</span> {resident.guardianName || "—"} ({resident.guardianPhone || "—"})</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(resident.documents || ["Aadhaar Card (Encrypted)", "PAN Card Verified", "College/Company ID Proof", "Police Verification Clearance"]).map((doc: string, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{doc}</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">✔ Verified by Admin</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">View</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "agreement" && (
              <div className="space-y-4">
                {resident.residentAgreements?.[0] || resident.agreement ? (
                  (() => {
                    const agr = resident.residentAgreements?.[0] || resident.agreement;
                    return (
                      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-bold text-white">{agr.agreementNumber}</h4>
                            <p className="text-xs text-neutral-400">Status: <span className="text-amber-400 font-semibold">{agr.status}</span></p>
                          </div>
                          <a
                            href={`/api/v1/agreements/${agr.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400"
                          >
                            Download PDF
                          </a>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
                          <p><span className="text-neutral-500">Monthly Rent:</span> ₹{Number(agr.rentAmount || 0).toLocaleString('en-IN')}</p>
                          <p><span className="text-neutral-500">Deposit:</span> ₹{Number(agr.depositAmount || 0).toLocaleString('en-IN')}</p>
                          <p><span className="text-neutral-500">Lock-in Period:</span> {agr.lockInPeriodMonths || 3} Months</p>
                          <p><span className="text-neutral-500">Notice Period:</span> {agr.noticePeriodDays || 30} Days</p>
                          <p><span className="text-neutral-500">Start Date:</span> {new Date(agr.startDate).toLocaleDateString('en-IN')}</p>
                          <p><span className="text-neutral-500">End Date:</span> {new Date(agr.endDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-neutral-400 text-sm">No active lease agreement on file for this resident.</p>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-3">
                {(resident.payments || resident.invoices || []).map((p: any) => (
                  <div key={p.id || p.inv} className="p-4 rounded-xl bg-neutral-900 border border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{p.invoiceNumber || p.inv}</p>
                      <p className="text-xs text-neutral-400">Period: {p.billingMonth ? `${p.billingMonth}/${p.billingYear}` : (p.paymentDate || p.date)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold text-emerald-400">₹{Number(p.totalAmount || p.amount || 0).toLocaleString('en-IN')}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">{p.status || "PAID"}</span>
                    </div>
                  </div>
                ))}
                {(!resident.payments && !resident.invoices) && (
                  <p className="text-neutral-400 text-sm">No payment records found.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};