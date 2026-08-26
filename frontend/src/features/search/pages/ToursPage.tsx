import React, { useState, useEffect } from "react";
import { Calendar, ArrowLeft } from "lucide-react";
import type { Page } from "../../../app/App";
import { useTheme, ThemeToggle } from "../../../theme";
import { searchService } from "../../../services/search.service";

interface Props {
  navigate: (p: Page) => void;
}

export default function ToursPage({ navigate }: Props) {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [targetPgId, setTargetPgId] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [tourNotes, setTourNotes] = useState("");
  const { darkMode } = useTheme();

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    setLoading(true);
    try {
      const data = await searchService.getMyTours();
      setTours(data || []);
    } catch (e) {
      console.warn("Failed to load tours:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPgId || !tourDate) return;
    try {
      await searchService.requestTour({
        pgId: targetPgId,
        requestedSlot: new Date(tourDate).toISOString(),
        notes: tourNotes,
      });
      setShowRequestModal(false);
      setTargetPgId("");
      setTourDate("");
      setTourNotes("");
      loadTours();
    } catch (e) {
      console.warn("Failed to create tour:", e);
    }
  };

  const handleUpdateStatus = async (tourId: string, status: "CONFIRMED" | "CANCELLED") => {
    try {
      await searchService.updateTourStatus(tourId, status);
      loadTours();
    } catch (e) {
      console.warn("Failed to update tour status:", e);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[var(--bg-primary)] text-[var(--text-main)]" : "bg-[var(--bg-primary)] text-[var(--text-main)]"}`}>
      <div className={`border-b ${darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("landing")} className="p-2 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-surface)] cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Property Tour Requests</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowRequestModal(true)} className="btn-primary px-4 py-2 text-xs font-bold">
              + Schedule New Visit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="p-12 text-center text-sm animate-pulse">Loading tours...</div>
        ) : tours.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto text-[var(--brand-primary)]/40 mb-3" />
            <h3 className="text-lg font-bold">No Property Visits Scheduled</h3>
            <p className="text-sm opacity-60 mt-1 mb-4 text-[var(--text-muted)]">Book a guided in-person or virtual tour with the property manager.</p>
            <button onClick={() => setShowRequestModal(true)} className="btn-primary px-6 py-2.5 text-xs font-bold">
              Schedule Tour
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map((t) => (
              <div key={t.id} className={`p-6 rounded-2xl border ${darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                      {t.pg?.name || "RoomBae Residency"}
                    </span>
                    <h3 className="text-base font-bold mt-1.5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--brand-primary)]" /> {new Date(t.requestedSlot).toLocaleString()}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    t.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    t.status === "PENDING" ? "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30" :
                    "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}>
                    {t.status}
                  </span>
                </div>

                {t.notes && <p className="text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-surface)] p-3 rounded-xl">Notes: {t.notes}</p>}

                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-main)]">
                  <button onClick={() => handleUpdateStatus(t.id, "CONFIRMED")} className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30">
                    Confirm
                  </button>
                  <button onClick={() => handleUpdateStatus(t.id, "CANCELLED")} className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 hover:bg-rose-500/30">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border ${darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
            <h3 className="text-lg font-bold mb-4">Schedule Property Visit</h3>
            <form onSubmit={handleCreateTour} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Property ID / Select Property</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pg_aurora_01"
                  value={targetPgId}
                  onChange={(e) => setTargetPgId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Preferred Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Special Notes / Queries</label>
                <textarea
                  rows={3}
                  placeholder="Any questions for the property manager?"
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--bg-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
