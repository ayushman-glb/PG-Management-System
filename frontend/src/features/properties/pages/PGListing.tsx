import { useState, useEffect, useCallback, useRef } from "react";
import {
  SlidersHorizontal,
  MapPin,
  RefreshCw,
  RotateCcw,
  Compass,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle } from "@theme/index";
import { BackButton } from "@app/navigation";
import { api } from "@services/api";
import { PropertyCard, PropertyCardData } from "@components/ui/PropertyCard";
import { CategoryStrip } from "@components/ui/CategoryStrip";
import { Logo } from "@components/ui/Logo";
import { LocationAutocomplete } from "@components/ui/LocationAutocomplete";
import {
  useSearchStore,
  GenderTypeFilter,
  RoomTypeFilter,
  SortByOption,
} from "../../../store/useSearchStore";

interface Props {
  navigate: (p: Page) => void;
}

const POPULAR_AMENITIES = [
  "WiFi",
  "AC",
  "Food",
  "Power Backup",
  "Laundry",
  "CCTV",
  "Attached Bathroom",
  "Housekeeping",
];

const fallbackPgs: PropertyCardData[] = [
  {
    id: "fb-1",
    name: "Sunrise Luxury PG • Private & Shared",
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
    distanceKm: 0.8,
    distanceText: "0.8 km from Koramangala",
  },
  {
    id: "fb-2",
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
    distanceKm: 2.1,
    distanceText: "2.1 km from HSR Layout",
  },
  {
    id: "fb-3",
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
    distanceKm: 3.4,
    distanceText: "3.4 km from Indiranagar",
  },
  {
    id: "fb-4",
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
    distanceKm: 4.8,
    distanceText: "4.8 km from Whitefield",
  },
];

export default function PGListing({ navigate }: Props) {
  const selectedLocation = useSearchStore((s) => s.selectedLocation);
  const setSelectedLocation = useSearchStore((s) => s.setSelectedLocation);
  const searchQuery = useSearchStore((s) => s.searchQuery);
  const radiusKm = useSearchStore((s) => s.radiusKm);
  const setRadiusKm = useSearchStore((s) => s.setRadiusKm);
  const genderType = useSearchStore((s) => s.genderType);
  const setGenderType = useSearchStore((s) => s.setGenderType);
  const roomType = useSearchStore((s) => s.roomType);
  const setRoomType = useSearchStore((s) => s.setRoomType);
  const priceRange = useSearchStore((s) => s.priceRange);
  const setPriceRange = useSearchStore((s) => s.setPriceRange);
  const amenities = useSearchStore((s) => s.amenities);
  const toggleAmenity = useSearchStore((s) => s.toggleAmenity);
  const sortBy = useSearchStore((s) => s.sortBy);
  const setSortBy = useSearchStore((s) => s.setSortBy);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [pgList, setPgList] = useState<PropertyCardData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProperties = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);

    try {
      const backendGender =
        genderType === "BOYS"
          ? "BOYS"
          : genderType === "GIRLS"
          ? "GIRLS"
          : genderType === "CO_LIVING"
          ? "CO_LIVING"
          : undefined;

      const backendRoomType =
        roomType === "SINGLE"
          ? "SINGLE"
          : roomType === "DOUBLE"
          ? "DOUBLE"
          : roomType === "TRIPLE"
          ? "TRIPLE"
          : roomType === "FOUR_SHARING"
          ? "FOUR_SHARING"
          : undefined;

      const res = await api.searchProperties(
        {
          query: searchQuery || undefined,
          city: selectedLocation?.city || undefined,
          locality: selectedLocation?.locality || undefined,
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
          radiusKm: radiusKm,
          genderType: backendGender,
          roomType: backendRoomType,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          amenities: amenities.length > 0 ? amenities : undefined,
          sortBy,
          limit: 24,
        },
        controller.signal
      );

      if (res && Array.isArray(res.pgs) && res.pgs.length > 0) {
        const mapped: PropertyCardData[] = res.pgs.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location
            ? [p.location.locality, p.location.city].filter(Boolean).join(", ")
            : "Bengaluru",
          city: p.location?.city || "Bengaluru",
          price: p.basePrice || 8000,
          rating: p.rating || 4.8,
          reviews: p.reviewCount || 12,
          sharingType: p.mealPlan || "Meals Included",
          images: p.images?.length
            ? p.images.map((i: any) => i.secureUrl || i)
            : [p.featuredImage || fallbackPgs[0].images[0]],
          isGuestFavorite: p.rating >= 4.85,
          distanceKm: p.distanceKm,
          distanceText: p.distanceText,
        }));

        setPgList(mapped);
        setTotalCount(res.total);
      } else {
        // Use fallback demo PGs filtered client side if backend DB has sparse seed
        const fallbackFiltered = fallbackPgs.filter((p) => p.price <= priceRange[1]);
        setPgList(fallbackFiltered);
        setTotalCount(fallbackFiltered.length);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setFetchError("Unable to load properties. Showing cached listings.");
        setPgList(fallbackPgs);
        setTotalCount(fallbackPgs.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, searchQuery, radiusKm, genderType, roomType, priceRange, amenities, sortBy]);

  useEffect(() => {
    fetchProperties();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProperties]);

  const activeLocationTitle = selectedLocation?.name || selectedLocation?.locality || "Bengaluru";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] font-sans transition-colors">
      {/* ─── Sticky Location Intelligence Header ─────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-main)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <Logo onClick={() => navigate("landing")} size="sm" />
          </div>

          {/* Location Autocomplete Pill */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="search-pill flex items-center h-12 px-3.5 gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)]/50 transition-colors">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
              <LocationAutocomplete
                placeholder="Search any Indian locality or city..."
                onSelect={(loc) => setSelectedLocation(loc)}
                inputClassName="text-xs md:text-sm font-medium text-[var(--text-main)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                showFilters
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-[var(--border-main)] text-[var(--text-main)] hover:border-[var(--text-main)]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {(genderType !== "ALL" || roomType !== "ALL" || amenities.length > 0 || radiusKm !== 15) && (
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
              )}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* ─── Collapsible Filter Drawer ─────────────────────────── */}
        {showFilters && (
          <div className="border-t border-[var(--border-main)] bg-[var(--bg-surface)] px-4 md:px-6 py-4 animate-in fade-in slide-in-from-top-2">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Row 1: Radius & Price & Sort */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-main)]/50">
                {/* Search Radius Slider */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                    <Compass className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    Radius: <span className="text-[var(--text-main)]">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    aria-label="Search radius in kilometers"
                    className="w-28 sm:w-36 accent-[var(--brand-primary)]"
                  />
                </div>

                {/* Price Range Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    Max Rent: <span className="text-[var(--text-main)]">₹{priceRange[1].toLocaleString("en-IN")}/mo</span>
                  </span>
                  <input
                    type="range"
                    min={5000}
                    max={40000}
                    step={1000}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    aria-label="Maximum rent budget filter"
                    className="w-28 sm:w-36 accent-[var(--brand-primary)]"
                  />
                </div>

                {/* Sorting Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortByOption)}
                    aria-label="Sort properties by"
                    className="text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg px-2.5 py-1.5 text-[var(--text-main)] outline-none cursor-pointer"
                  >
                    <option value="recommended">Recommended (Best Match)</option>
                    <option value="distance">Proximity (Nearest First)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated (4.8+)</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Row 2: Gender & Sharing Type Pills */}
              <div className="flex flex-wrap items-center gap-6">
                {/* Gender Type */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Gender:</span>
                  {(
                    [
                      { id: "ALL", label: "All" },
                      { id: "BOYS", label: "Men's" },
                      { id: "GIRLS", label: "Women's" },
                      { id: "CO_LIVING", label: "Co-Living" },
                    ] as const
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGenderType(g.id as GenderTypeFilter)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        genderType === g.id
                          ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                          : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:border-[var(--text-main)]"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Sharing Type */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Sharing:</span>
                  {(
                    [
                      { id: "ALL", label: "All" },
                      { id: "SINGLE", label: "Single" },
                      { id: "DOUBLE", label: "Double" },
                      { id: "TRIPLE", label: "Triple" },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoomType(r.id as RoomTypeFilter)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        roomType === r.id
                          ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                          : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:border-[var(--text-main)]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Amenities Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-[var(--text-muted)] mr-1">Amenities:</span>
                {POPULAR_AMENITIES.map((amenity) => {
                  const isSelected = amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--accent-forest)]/15 text-[var(--accent-forest)] border-[var(--accent-forest)]"
                          : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
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

      {/* ─── Listings Main Section ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                PGs & Co-Living in {activeLocationTitle}
              </h1>
              {selectedLocation?.latitude && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Sparkles className="w-3 h-3" />
                  Within {radiusKm} km
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Showing {totalCount} verified properties • Prices include high-speed WiFi, housekeeping & maintenance
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProperties}
            aria-label="Refresh search results"
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="flex flex-col gap-3">
                <div className="aspect-[4/3] w-full rounded-2xl bg-[var(--bg-nested)] skeleton-wave" />
                <div className="h-4 w-3/4 bg-[var(--bg-nested)] rounded skeleton-wave" />
                <div className="h-3 w-1/2 bg-[var(--bg-nested)] rounded skeleton-wave" />
                <div className="h-4 w-1/3 bg-[var(--bg-nested)] rounded skeleton-wave" />
              </div>
            ))}
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && pgList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {pgList.map((pg) => (
              <PropertyCard
                key={pg.id}
                property={pg}
                onClick={() => navigate("pg-details")}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && pgList.length === 0 && (
          <div className="text-center py-20 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-main)] p-8 max-w-lg mx-auto">
            <p className="text-5xl mb-3">📍</p>
            <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">
              No PGs found within {radiusKm} km of {activeLocationTitle}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              Try increasing the search radius slider, widening your budget, or clearing amenity filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reset Filters & Expand Radius
            </button>
          </div>
        )}

        {fetchError && (
          <div className="mt-8 p-3 rounded-xl bg-amber-500/10 text-amber-500 text-xs text-center">
            {fetchError}
          </div>
        )}
      </main>
    </div>
  );
}
