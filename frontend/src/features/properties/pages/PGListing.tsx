import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle } from "@theme/index";
import { BackButton } from "@app/navigation";
import { api } from "@services/api";
import { PropertyCard, PropertyCardData } from "@components/ui/PropertyCard";
import { CategoryStrip } from "@components/ui/CategoryStrip";
import { Logo } from "@components/ui/Logo";

interface Props {
  navigate: (p: Page) => void;
}

const defaultPgs: PropertyCardData[] = [
  {
    id: 1,
    name: "Sunrise PG Homes • Private & Shared",
    location: "Koramangala 5th Block, Bengaluru",
    city: "Bengaluru",
    price: 8500,
    rating: 4.92,
    reviews: 128,
    sharingType: "Single & Double",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    ],
    isGuestFavorite: true,
  },
  {
    id: 2,
    name: "Green Valley Residency • Women's Wing",
    location: "HSR Layout Sector 1, Bengaluru",
    city: "Bengaluru",
    price: 7500,
    rating: 4.85,
    reviews: 89,
    sharingType: "Double Sharing",
    images: [
      "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800&q=80",
      "https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?w=800&q=80",
    ],
    isGuestFavorite: true,
    liked: true,
  },
  {
    id: 3,
    name: "Urban Nest Co-Living Suites",
    location: "Indiranagar 100ft Road, Bengaluru",
    city: "Bengaluru",
    price: 12000,
    rating: 4.96,
    reviews: 214,
    sharingType: "Private Studio",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    ],
    isGuestFavorite: true,
  },
  {
    id: 4,
    name: "City Heights PG & Co-Living",
    location: "Whitefield ITPL Road, Bengaluru",
    city: "Bengaluru",
    price: 9000,
    rating: 4.78,
    reviews: 67,
    sharingType: "Triple Sharing",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    isGuestFavorite: false,
  },
  {
    id: 5,
    name: "Serene Stay Eco PG",
    location: "Electronic City Phase 1, Bengaluru",
    price: 7000,
    rating: 4.82,
    reviews: 45,
    sharingType: "Double Sharing",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    ],
    isGuestFavorite: false,
  },
  {
    id: 6,
    name: "Metro Living Co-Op",
    location: "Marathahalli Bridge, Bengaluru",
    price: 10500,
    rating: 4.89,
    reviews: 103,
    sharingType: "Single Suite",
    images: [
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
    ],
    isGuestFavorite: true,
    liked: true,
  },
];

export default function PGListing({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pgType, setPgType] = useState<"All" | "Men's" | "Women's" | "Mixed">("All");
  const [maxPrice, setMaxPrice] = useState(25000);
  const [showFilters, setShowFilters] = useState(false);
  const [pgList, setPgList] = useState<PropertyCardData[]>(defaultPgs);

  useEffect(() => {
    api.getPublicProperties({ city: search || undefined, maxRent: maxPrice }).then((res) => {
      if (res && res.properties && Array.isArray(res.properties) && res.properties.length > 0) {
        const mappedBackendPgs: PropertyCardData[] = res.properties.map((p: any, idx: number) => ({
          id: p.id || idx + 100,
          name: p.name,
          location: p.address || "Bengaluru",
          city: p.city || "Bengaluru",
          price: p.minRent || 8500,
          rating: 4.85,
          reviews: 24,
          sharingType: p.sharingType || "Single / Double",
          images: p.images && p.images.length > 0
            ? p.images
            : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
          isGuestFavorite: true,
          liked: false,
        }));

        setPgList([...mappedBackendPgs, ...defaultPgs]);
      }
    }).catch(() => {});
  }, [search, maxPrice]);

  const filtered = pgList.filter((pg) => {
    const matchSearch =
      pg.name.toLowerCase().includes(search.toLowerCase()) ||
      pg.location.toLowerCase().includes(search.toLowerCase());
    const matchPrice = pg.price <= maxPrice;
    return matchSearch && matchPrice;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] font-sans transition-colors">
      {/* ─── Airbnb Top Sticky Header ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-main)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <Logo onClick={() => navigate("landing")} size="sm" />
          </div>

          {/* Airbnb Compact Search Pill */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="search-pill flex items-center h-12 px-4 gap-2">
              <Search className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by city, neighborhood, or PG name..."
                aria-label="Search properties"
                className="w-full bg-transparent text-xs md:text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted-soft)] outline-none truncate"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-[var(--border-main)] text-xs font-semibold hover:border-[var(--text-main)] transition-colors cursor-pointer text-[var(--text-main)]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Filter Drawer / Dropdown */}
        {showFilters && (
          <div className="border-t border-[var(--border-main)] bg-[var(--bg-surface)] px-4 md:px-6 py-4 animate-fade-in">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  Sharing Type:
                </span>
                {(["All", "Men's", "Women's", "Mixed"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPgType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      pgType === t
                        ? "bg-[var(--text-main)] text-[var(--bg-primary)] border-[var(--text-main)]"
                        : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  Max Price: ₹{maxPrice.toLocaleString()}/mo
                </span>
                <input
                  type="range"
                  min={5000}
                  max={35000}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum monthly rent filter"
                  className="w-36 accent-[var(--brand-primary)]"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Category Strip */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* ─── Listings Grid ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Over {filtered.length} verified stays available
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Prices include taxes, high-speed WiFi, housekeeping and maintenance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filtered.map((pg) => (
            <PropertyCard
              key={pg.id}
              property={pg}
              onClick={() => navigate("pg-details")}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-3">🏡</p>
            <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">
              No exact matches found
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Try widening your search terms or increasing your maximum price filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
