import { useState, useEffect } from "react";
import { Heart, MapPin, ArrowLeft } from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle, useTheme } from "@theme/index";
import { api } from "@services/api";

interface Props {
  navigate: (p: Page) => void;
}

export default function ShortlistPage({ navigate }: Props) {
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchShortlist();
  }, []);

  const fetchShortlist = async () => {
    try {
      setLoading(true);
      const res = await api.getShortlist();
      if (res && res.data) {
        setShortlist(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (pgId: string) => {
    try {
      await api.toggleShortlist(pgId);
      setShortlist((prev) => prev.filter((item) => item.id !== pgId));
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
            <Heart className="w-12 h-12 mx-auto text-amber-500/40 mb-3" />
            <h3 className="text-lg font-bold">No Shortlisted Properties</h3>
            <p className="text-sm opacity-60 mt-1 mb-4">You haven't saved any PG properties to your shortlist yet.</p>
            <button onClick={() => navigate("pg-listing")} className="luxury-btn-primary px-6 py-2.5 text-xs font-bold">
              Explore PGs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortlist.map((pg) => (
              <div key={pg.id} className={`rounded-2xl border overflow-hidden p-5 flex flex-col justify-between ${darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-white border-[var(--border-main)]"}`}>
                <div>
                  <div className="relative h-44 rounded-xl overflow-hidden mb-4">
                    <img src={pg.logo || (pg.galleryImages && pg.galleryImages[0]) || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format"} alt={pg.name} className="w-full h-full object-cover" />
                    <button onClick={() => handleRemove(pg.id)} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-red-500 hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg">{pg.name}</h3>
                  <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> {pg.address}, {pg.city}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-amber-500">₹{pg.rentStartingFrom || 8500}</span>
                    <span className="text-xs opacity-60">/month</span>
                  </div>
                  <button onClick={() => navigate("pg-details")} className="luxury-btn-primary px-4 py-2 text-xs font-bold">
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
