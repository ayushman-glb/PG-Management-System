import { useState, useEffect } from "react";
import { Heart, MapPin, ArrowLeft } from "lucide-react";
import type { Page } from "../../../app/App";
import { useTheme, ThemeToggle } from "../../../theme";
import { searchService } from "../../../services/search.service";

interface Props {
  navigate: (p: Page) => void;
}

export default function ShortlistPage({ navigate }: Props) {
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    loadShortlist();
  }, []);

  const loadShortlist = async () => {
    setLoading(true);
    try {
      const data = await searchService.getShortlist();
      setShortlist(data || []);
    } catch (e) {
      console.warn("Failed to load shortlist:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (pgId: string) => {
    try {
      await searchService.removeFromShortlist(pgId);
      setShortlist(shortlist.filter((s) => s.id !== pgId));
    } catch (e) {
      console.warn("Failed to remove shortlist item:", e);
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
            <h1 className="text-xl font-bold">My Saved Shortlist</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="p-12 text-center text-sm animate-pulse">Loading saved properties...</div>
        ) : shortlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 mx-auto text-[var(--accent-ruby)]/40 mb-3" />
            <h3 className="text-lg font-bold">No Shortlisted Properties</h3>
            <p className="text-sm opacity-60 mt-1 mb-4 text-[var(--text-muted)]">You haven't saved any PG properties to your shortlist yet.</p>
            <button onClick={() => navigate("pg-listing")} className="btn-primary px-6 py-2.5 text-xs font-bold">
              Explore PGs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortlist.map((pg) => (
              <div key={pg.id} className={`rounded-2xl border overflow-hidden p-5 flex flex-col justify-between ${darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
                <div>
                  <div className="relative h-44 rounded-xl overflow-hidden mb-4">
                    <img src={pg.logo || (pg.galleryImages && pg.galleryImages[0]) || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format"} alt={pg.name} className="w-full h-full object-cover" />
                    <button onClick={() => handleRemove(pg.id)} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-[var(--accent-ruby)] hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 fill-[var(--accent-ruby)] text-[var(--accent-ruby)]" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg">{pg.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> {pg.address}, {pg.city}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-[var(--brand-primary)]">₹{pg.rentStartingFrom || 8500}</span>
                    <span className="text-xs opacity-60">/month</span>
                  </div>
                  <button onClick={() => navigate("pg-details")} className="btn-primary px-4 py-2 text-xs font-bold">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
