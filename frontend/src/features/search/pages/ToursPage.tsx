import { useState, useEffect } from "react";
import { Calendar, ArrowLeft } from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle, useTheme } from "@theme/index";
import { api } from "@services/api";

interface Props {
  navigate: (p: Page) => void;
}

export default function ToursPage({ navigate }: Props) {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await api.getTours();
      if (res && res.data) {
        setTours(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !newSlot) return;

    try {
      await api.requestTour({
        propertyId: selectedPropertyId,
        requestedSlot: newSlot,
        notes,
      });
      setShowRequestModal(false);
      fetchTours();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (tourId: string, status: string) => {
    try {
      await api.updateTourStatus(tourId, { status });
      fetchTours();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[var(--bg-primary)] text-[var(--text-main)]" : "bg-[var(--bg-primary)] text-[var(--text-main)]"}`}>
      <div className={`sticky top-0 z-40 border-b px-6 py-4 backdrop-blur-md ${darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-[var(--bg-primary)] border-[var(--border-main)]"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("pg-listing")} className="p-2 rounded-xl border border-white/10 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Property Tour Requests</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowRequestModal(true)} className="luxury-btn-primary px-4 py-2 text-xs font-bold">
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
            <Calendar className="w-12 h-12 mx-auto text-amber-500/40 mb-3" />
            <h3 className="text-lg font-bold">No Property Visits Scheduled</h3>
            <p className="text-sm opacity-60 mt-1 mb-4">Book a guided in-person or virtual tour with the property manager.</p>
            <button onClick={() => setShowRequestModal(true)} className="luxury-btn-primary px-6 py-2.5 text-xs font-bold">
              Schedule Tour
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map((t) => (
              <div key={t.id} className={`p-6 rounded-2xl border ${darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                      {t.pg?.name || "RoomBae Residency"}
                    </span>
                    <h3 className="text-base font-bold mt-1.5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" /> {new Date(t.requestedSlot).toLocaleString()}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    t.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    t.status === "PENDING" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}>
                    {t.status}
                  </span>
                </div>

                {t.notes && <p className="text-xs opacity-70 mb-4 bg-white/5 p-3 rounded-xl">Notes: {t.notes}</p>}

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
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
          <div className={`w-full max-w-md p-6 rounded-3xl border ${darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
            <h3 className="text-lg font-bold mb-4">Schedule Property Visit</h3>
            <form onSubmit={handleCreateTour} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Property ID / Select Property</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 660f1a9b2c3d4e5f6a7b8c9d"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[var(--bg-primary)] border-[var(--border-main)]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[var(--bg-primary)] border-[var(--border-main)]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Notes / Preferences</label>
                <textarea
                  rows={3}
                  placeholder="Looking for double sharing AC room..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[var(--bg-primary)] border-[var(--border-main)]" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-white/10">
                  Cancel
                </button>
                <button type="submit" className="flex-1 luxury-btn-primary py-2.5 text-xs font-bold rounded-xl">
                  Book Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
