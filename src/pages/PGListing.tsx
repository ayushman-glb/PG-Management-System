import { useState } from "react";
import {
  Search,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Car,
  Shield,
  Zap,
  Filter,
  SlidersHorizontal,
  Heart,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";

interface Props {
  navigate: (p: Page) => void;
}

const amenityIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  WiFi: Wifi,
  Meals: Coffee,
  Parking: Car,
  Security: Shield,
  "Power Backup": Zap,
};

const pgs = [
  {
    id: 1,
    name: "Sunrise PG Homes",
    location: "Koramangala 5th Block",
    city: "Bengaluru",
    price: 8500,
    rating: 4.9,
    reviews: 128,
    type: "Mixed",
    amenities: ["WiFi", "Meals", "Parking", "Security", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format",
    ],
    available: 3,
    badge: "Top Rated",
    badgeColor: "bg-amber-400",
    liked: false,
  },
  {
    id: 2,
    name: "Green Valley Residency",
    location: "HSR Layout Sector 1",
    city: "Bengaluru",
    price: 7500,
    rating: 4.7,
    reviews: 89,
    type: "Women's",
    amenities: ["WiFi", "Meals", "Security"],
    images: [
      "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&h=400&fit=crop&auto=format",
    ],
    available: 5,
    badge: "Women's Only",
    badgeColor: "bg-pink-500",
    liked: true,
  },
  {
    id: 3,
    name: "Urban Nest Co-living",
    location: "Indiranagar 100ft Road",
    city: "Bengaluru",
    price: 12000,
    rating: 4.8,
    reviews: 214,
    type: "Mixed",
    amenities: ["WiFi", "Meals", "Parking", "Security", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&auto=format",
    ],
    available: 2,
    badge: "Premium",
    badgeColor: "luxury-btn-primary",
    liked: false,
  },
  {
    id: 4,
    name: "City Heights PG",
    location: "Whitefield ITPL Road",
    city: "Bengaluru",
    price: 9000,
    rating: 4.6,
    reviews: 67,
    type: "Men's",
    amenities: ["WiFi", "Security", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&auto=format",
    ],
    available: 7,
    badge: null,
    badgeColor: "",
    liked: false,
  },
  {
    id: 5,
    name: "Serene Stay PG",
    location: "Electronic City Phase 1",
    city: "Bengaluru",
    price: 7000,
    rating: 4.5,
    reviews: 45,
    type: "Mixed",
    amenities: ["WiFi", "Meals", "Security"],
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop&auto=format",
    ],
    available: 10,
    badge: "Budget Pick",
    badgeColor: "bg-green-500",
    liked: false,
  },
  {
    id: 6,
    name: "Metro Living PG",
    location: "Marathahalli Bridge",
    city: "Bengaluru",
    price: 10500,
    rating: 4.7,
    reviews: 103,
    type: "Mixed",
    amenities: ["WiFi", "Meals", "Parking", "Security"],
    images: [
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop&auto=format",
    ],
    available: 4,
    badge: null,
    badgeColor: "",
    liked: true,
  },
];

export default function PGListing({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const [pgType, setPgType] = useState<"All" | "Men's" | "Women's" | "Mixed">(
    "All",
  );
  const [maxPrice, setMaxPrice] = useState(15000);
  const [likes, setLikes] = useState<Record<number, boolean>>(
    Object.fromEntries(pgs.map((p) => [p.id, p.liked])),
  );
  const [showFilters, setShowFilters] = useState(false);
  const { darkMode } = useTheme();

  const filtered = pgs.filter((pg) => {
    const matchSearch =
      pg.name.toLowerCase().includes(search.toLowerCase()) ||
      pg.location.toLowerCase().includes(search.toLowerCase());
    const matchType = pgType === "All" || pg.type === pgType;
    const matchPrice = pg.price <= maxPrice;
    return matchSearch && matchType && matchPrice;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b transition-colors ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <button
                onClick={() => navigate("landing")}
                className={`hidden sm:flex items-center gap-2 transition-colors text-sm font-medium ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <span>Home</span>
              </button>
            </div>

            {/* Search bar */}
            <div className={`order-3 basis-full flex min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-2xl border px-4 py-3 sm:order-none sm:basis-auto ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"
            }`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, name, or amenity..."
                className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? "text-[#F7F3EE] placeholder:text-[#756A63]" : "text-[#3B2A24] placeholder:text-[#A8907F]"}`}
              />
            </div>

            <ThemeToggle />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex flex-shrink-0 items-center gap-2 border text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-colors ${
                darkMode
                  ? "border-[#4A443F] text-slate-300 hover:bg-[#332D2B]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-4 pb-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Type:
                </span>
                <div className="flex gap-1.5">
                  {(["All", "Men's", "Women's", "Mixed"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPgType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        pgType === t
                          ? "luxury-btn-primary text-white"
                          : darkMode
                            ? "bg-[#332D2B] text-slate-300 hover:bg-[#3D3632]"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Max Price: ₹{maxPrice.toLocaleString()}/mo
                </span>
                <input
                  type="range"
                  min={5000}
                  max={20000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-32 accent-[#D9A87C]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
              PG Accommodations in Bengaluru
            </h1>
            <p className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {filtered.length} properties found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
            <select className={`text-sm border rounded-xl px-3 py-2 outline-none ${
              darkMode
                ? "bg-[#2B2725] border-[#4A443F] text-[#F7F3EE] focus:ring-[#C89A4B]"
                : "bg-white border-slate-200 text-slate-600 focus:ring-[#D9A87C]"
            }`}>
              <option>Best Match</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((pg) => (
            <div
              key={pg.id}
              className={`rounded-2xl border overflow-hidden card-hover group ${
                darkMode
                  ? "bg-[#2B2725] border-[#4A443F]"
                  : "bg-white border-slate-100"
              }`}
            >
              {/* Image */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={pg.images[0]}
                  alt={pg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Badge */}
                {pg.badge && (
                  <div
                    className={`absolute top-3 left-3 ${pg.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}
                  >
                    {pg.badge}
                  </div>
                )}

                {/* Like button */}
                <button
                  onClick={() =>
                    setLikes((prev) => ({ ...prev, [pg.id]: !prev[pg.id] }))
                  }
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform ${
                    darkMode ? "bg-[#1D1B1A]/80 backdrop-blur-sm" : "bg-white/90 backdrop-blur-sm"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${likes[pg.id] ? "fill-red-500 text-red-500" : "text-slate-400"}`}
                  />
                </button>

                {/* Type badge */}
                <div className={`absolute bottom-3 left-3 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full ${
                  darkMode ? "bg-[#1D1B1A]/80 text-slate-200" : "bg-white/90 text-slate-700"
                }`}>
                  {pg.type}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`font-bold leading-snug ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {pg.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {pg.rating}
                    </span>
                    <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      ({pg.reviews})
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <MapPin className="w-3 h-3" />
                  <span>
                    {pg.location}, {pg.city}
                  </span>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {pg.amenities.slice(0, 4).map((a) => {
                    const Icon = amenityIcons[a];
                    return Icon ? (
                      <div
                        key={a}
                        title={a}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          darkMode ? "bg-[#332D2B] text-slate-300" : "bg-slate-100 text-slate-500 hover:bg-[#F8EEE5]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    ) : null;
                  })}
                  {pg.amenities.length > 4 && (
                    <span className={`text-xs font-medium ml-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      +{pg.amenities.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                      ₹{pg.price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>/month</span>
                    <p className="text-xs text-green-500 font-medium mt-0.5">
                      {pg.available} beds available
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("pg-details")}
                    className="luxury-btn-primary text-sm font-semibold px-4 py-2.5"
                  >
                    Book Visit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🏠</p>
            <h3 className={`text-lg font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}>
              No PGs found
            </h3>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
