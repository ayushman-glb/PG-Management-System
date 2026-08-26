import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle } from "@theme/index";
import { Logo } from "@components/ui/Logo";
import { Button } from "@components/ui/Button";
import { SearchPill } from "@components/ui/SearchPill";
import { CategoryStrip } from "@components/ui/CategoryStrip";
import { PropertyCard, PropertyCardData } from "@components/ui/PropertyCard";
import { useAuth } from "@hooks/useAuth";

interface Props {
  navigate: (p: Page) => void;
}

export const Landing: React.FC<Props> = ({ navigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const rawRole = (user?.role || "").toUpperCase();

  const [activeProductTab, setActiveProductTab] = useState<"homes" | "coliving" | "services">("homes");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const sampleProperties: PropertyCardData[] = [
    {
      id: "p1",
      name: "Zolo Stays Prime • Single Suite",
      location: "Koramangala 5th Block, Bengaluru",
      price: 14500,
      rating: 4.96,
      reviews: 128,
      sharingType: "Private Suite",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      ],
    },
    {
      id: "p2",
      name: "Stanza Living • Nordic Studio",
      location: "HSR Layout Sector 2, Bengaluru",
      price: 18000,
      rating: 4.92,
      reviews: 94,
      sharingType: "Studio Apartment",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?w=800&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
      ],
    },
    {
      id: "p3",
      name: "Urban Nest Luxury Living",
      location: "Indiranagar 100ft Road, Bengaluru",
      price: 16500,
      rating: 4.88,
      reviews: 62,
      sharingType: "Double Sharing",
      isGuestFavorite: false,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
      ],
    },
    {
      id: "p4",
      name: "Silicon Oasis Suites",
      location: "Whitefield ITPL Main Rd, Bengaluru",
      price: 12000,
      rating: 4.85,
      reviews: 47,
      sharingType: "Double Sharing",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80",
      ],
    },
    {
      id: "p5",
      name: "CyberHub Executive Residency",
      location: "DLF Phase 3, Cyber City, Gurugram",
      price: 21000,
      rating: 4.98,
      reviews: 156,
      sharingType: "Private 1BHK",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      ],
    },
    {
      id: "p6",
      name: "Bandra SeaView Co-Living",
      location: "Pali Hill, Bandra West, Mumbai",
      price: 26000,
      rating: 4.95,
      reviews: 210,
      sharingType: "Private Studio",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
      ],
    },
    {
      id: "p7",
      name: "HITEC City Scholars Lodge",
      location: "Madhapur, HITEC City, Hyderabad",
      price: 13500,
      rating: 4.87,
      reviews: 73,
      sharingType: "Triple Sharing",
      isGuestFavorite: false,
      images: [
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      ],
    },
    {
      id: "p8",
      name: "Kalyani Nagar Executive Stays",
      location: "Kalyani Nagar, Pune",
      price: 15000,
      rating: 4.91,
      reviews: 89,
      sharingType: "Double Sharing",
      isGuestFavorite: true,
      images: [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-[#222222] dark:text-[#f7f7f7] font-sans relative overflow-x-clip transition-colors">
      {/* ─── Airbnb 80px Top Navigation ─────────────────────────── */}
      <header className="sticky top-0 left-0 right-0 z-50 h-20 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-[#ebebeb] dark:border-[#242424] transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex-shrink-0">
            <Logo onClick={() => navigate("landing")} size="md" />
          </div>

          {/* Center: Airbnb 3-Product Navigation Tabs */}
          <nav aria-label="Product categories" className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              type="button"
              onClick={() => setActiveProductTab("homes")}
              className={`relative py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeProductTab === "homes"
                  ? "text-[#222222] dark:text-white"
                  : "text-[#6a6a6a] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white"
              }`}
            >
              Homes & PGs
              {activeProductTab === "homes" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] dark:bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveProductTab("coliving");
                navigate("pg-listing");
              }}
              className={`relative py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeProductTab === "coliving"
                  ? "text-[#222222] dark:text-white"
                  : "text-[#6a6a6a] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white"
              }`}
            >
              Co-Living Hubs
              {activeProductTab === "coliving" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] dark:bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveProductTab("services")}
              className={`relative py-2 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeProductTab === "services"
                  ? "text-[#222222] dark:text-white"
                  : "text-[#6a6a6a] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white"
              }`}
            >
              <span>Services</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#ff385c] text-white px-1.5 py-0.2 rounded-full">
                NEW
              </span>
              {activeProductTab === "services" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] dark:bg-white rounded-full" />
              )}
            </button>
          </nav>

          {/* Right: Host CTA, Globe, Theme, User Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => navigate("auth")}
              className="hidden lg:block text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#222222] dark:text-[#f7f7f7] transition-colors cursor-pointer"
            >
              RoomBae your property
            </button>

            <ThemeToggle />

            {/* User Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-[#dddddd] dark:border-[#2e2e2e] hover:shadow-md transition-all cursor-pointer bg-white dark:bg-[#1e1e1e]"
                aria-label="User navigation menu"
              >
                <Menu className="w-4 h-4 text-[#222222] dark:text-[#f7f7f7]" />
                <div className="w-8 h-8 rounded-full bg-[#ff385c] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-64 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#dddddd] dark:border-[#2e2e2e] shadow-xl py-2 z-50 text-sm overflow-hidden"
                  >
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-2 border-b border-[#dddddd] dark:border-[#2e2e2e]">
                          <p className="font-bold text-xs text-[#222222] dark:text-[#f7f7f7] truncate">{user.name || "Member"}</p>
                          <p className="text-[11px] text-[#6a6a6a] dark:text-[#a1a1aa] truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (rawRole === "RESIDENT") navigate("resident-portal");
                            else if (rawRole === "ADMIN" || rawRole === "SUPER_ADMIN") navigate("admin-console");
                            else navigate("dashboard");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-[#222222] dark:text-[#f7f7f7] flex items-center justify-between cursor-pointer"
                        >
                          <span>{rawRole === "RESIDENT" ? "Resident Portal" : "Management Dashboard"}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#ff385c]" />
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("pg-listing"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#6a6a6a] dark:text-[#a1a1aa] cursor-pointer"
                        >
                          Explore All PGs
                        </button>
                        <div className="h-[1px] bg-[#dddddd] dark:bg-[#2e2e2e] my-1" />
                        <button
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            await logout();
                            navigate("auth");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#c13515] font-medium cursor-pointer"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-[#222222] dark:text-[#f7f7f7] cursor-pointer"
                        >
                          Sign up
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#222222] dark:text-[#f7f7f7] cursor-pointer"
                        >
                          Log in
                        </button>
                        <div className="h-[1px] bg-[#dddddd] dark:bg-[#2e2e2e] my-1" />
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("pg-listing"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#6a6a6a] dark:text-[#a1a1aa] cursor-pointer"
                        >
                          Find PGs & Co-Living
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#6a6a6a] dark:text-[#a1a1aa] cursor-pointer"
                        >
                          Host your PG
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Signature Search Pill ─────────────── */}
      <section className="pt-8 pb-10 px-4 md:px-6 bg-white dark:bg-[#121212] transition-colors">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-clamp-hero font-bold tracking-tight text-[#222222] dark:text-[#f7f7f7] mb-6">
            Find premium PGs & Co-Living spaces.
          </h1>
          {/* Centered Airbnb 3-Segment Search Pill */}
          <div className="max-w-3xl mx-auto mb-8">
            <SearchPill onSearch={() => navigate("pg-listing")} />
          </div>
        </div>
      </section>

      {/* ─── Airbnb Sticky Category Filter Strip ─────────────────── */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          if (id !== "all") navigate("pg-listing");
        }}
        onOpenFilters={() => navigate("pg-listing")}
      />

      {/* ─── Photo-First Property Grid (Airbnb 4-Col Layout) ─────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#222222] dark:text-[#f7f7f7]">
              Trending stays across top tech hubs
            </h2>
            <p className="text-sm text-[#6a6a6a] dark:text-[#a1a1aa]">
              Verified luxury & student co-living spaces with premium amenities
            </p>
          </div>
          <button
            onClick={() => navigate("pg-listing")}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff385c] hover:underline cursor-pointer"
          >
            <span>Show all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {sampleProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onClick={() => navigate("pg-details")}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("pg-listing")}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Explore 500+ Verified PGs
          </Button>
        </div>
      </main>

      {/* ─── Airbnb Host / Property Owner Conversion Banner ───────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff385c] mb-2 inline-block">
              For Property Owners
            </span>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              Turn your PG property into a high-yield co-living space.
            </h2>
            <p className="text-sm md:text-base text-neutral-300 mb-8 leading-relaxed">
              Automate rent collection, resident KYC verification, room allocations, and complaint tickets with RoomBae's all-in-one property management OS.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("auth")}
              >
                Start Managing for Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white/40 hover:bg-white/10"
                onClick={() => setShowDemo(true)}
              >
                Watch 2-Min Demo
              </Button>
            </div>
          </div>

          <div className="relative w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80"
              alt="Luxury property"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ─── Inspiration for Future Stays (City Directory) ───────── */}
      <section className="border-t border-[#ebebeb] dark:border-[#242424] bg-[#f7f7f7] dark:bg-[#181818] py-12 px-4 md:px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-base font-bold text-[#222222] dark:text-[#f7f7f7] mb-6">
            Popular destinations for student & professional stays
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-xs">
            {[
              { city: "Bengaluru", count: "140+ Properties", sub: "Koramangala, HSR, Indiranagar" },
              { city: "Mumbai", count: "95+ Properties", sub: "Bandra, Andheri, Powai" },
              { city: "Delhi NCR", count: "120+ Properties", sub: "Gurugram, Noida, South Ex" },
              { city: "Hyderabad", count: "80+ Properties", sub: "HITEC City, Gachibowli" },
              { city: "Pune", count: "65+ Properties", sub: "Kalyani Nagar, Viman Nagar" },
              { city: "Chennai", count: "45+ Properties", sub: "OMR, Velachery, Guindy" },
            ].map((item) => (
              <button
                key={item.city}
                type="button"
                onClick={() => navigate("pg-listing")}
                className="text-left group cursor-pointer"
              >
                <p className="font-bold text-[#222222] dark:text-[#f7f7f7] group-hover:text-[#ff385c] transition-colors">
                  {item.city}
                </p>
                <p className="text-[#6a6a6a] dark:text-[#a1a1aa] mt-0.5">{item.count}</p>
                <p className="text-[10px] text-[#929292] truncate mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Airbnb 3-Column Footer & Global Legal Band ───────────── */}
      <footer className="border-t border-[#dddddd] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] pt-12 pb-8 px-4 md:px-6 text-xs text-[#6a6a6a] dark:text-[#a1a1aa] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#ebebeb] dark:border-[#242424]">
            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#f7f7f7] mb-3">Support</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("help-center")} className="hover:underline cursor-pointer">Help Center & Support</button></li>
                <li><a href="mailto:support@roombae.com" className="hover:underline">Contact Support Team</a></li>
                <li><a href="tel:+918000492233" className="hover:underline">+91 80004 92233</a></li>
                <li><button onClick={() => navigate("terms-of-service")} className="hover:underline cursor-pointer">Cancellation Options</button></li>
                <li><button onClick={() => navigate("privacy-policy")} className="hover:underline cursor-pointer">Safety Information</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#f7f7f7] mb-3">Hosting</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("auth")} className="hover:underline cursor-pointer">List your PG or Co-Living space</button></li>
                <li><button onClick={() => navigate("documentation")} className="hover:underline cursor-pointer">RoomBae for Property Owners</button></li>
                <li><button onClick={() => navigate("roadmap")} className="hover:underline cursor-pointer">Pricing & Plans</button></li>
                <li><button onClick={() => navigate("blog")} className="hover:underline cursor-pointer">Community Forum & Best Practices</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#222222] dark:text-[#f7f7f7] mb-3">RoomBae</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("about")} className="hover:underline cursor-pointer">About Us</button></li>
                <li><button onClick={() => navigate("blog")} className="hover:underline cursor-pointer">Newsroom & Blog</button></li>
                <li><button onClick={() => navigate("careers")} className="hover:underline cursor-pointer">Careers</button></li>
                <li><button onClick={() => navigate("privacy-policy")} className="hover:underline cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => navigate("terms-of-service")} className="hover:underline cursor-pointer">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>© {new Date().getFullYear()} RoomBae Technologies, Inc.</span>
              <span>·</span>
              <button onClick={() => navigate("privacy-policy")} className="hover:underline cursor-pointer">Privacy</button>
              <span>·</span>
              <button onClick={() => navigate("terms-of-service")} className="hover:underline cursor-pointer">Terms</button>
              <span>·</span>
              <button onClick={() => navigate("cookie-policy")} className="hover:underline cursor-pointer">Sitemap</button>
            </div>

            <div className="flex items-center gap-6 font-semibold text-[#222222] dark:text-[#f7f7f7]">
              <span className="flex items-center gap-1 cursor-pointer hover:underline">
                🌐 English (IN)
              </span>
              <span className="cursor-pointer hover:underline">
                ₹ INR
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-[#1e1e1e] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#dddddd] dark:border-[#2e2e2e] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ff385c]">
                  Product tour
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#222222] dark:text-[#f7f7f7]">
                  See RoomBae in action
                </h2>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                aria-label="Close demo"
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video w-full rounded-xl bg-neutral-900 flex items-center justify-center text-white mb-4">
                <Play className="w-12 h-12 text-[#ff385c]" />
              </div>
              <p className="text-sm text-[#6a6a6a] dark:text-[#a1a1aa] mb-6">
                RoomBae helps thousands of property owners automate billing, KYC, and complaint tracking effortlessly.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowDemo(false)}>Close</Button>
                <Button variant="primary" onClick={() => { setShowDemo(false); navigate("auth"); }}>Get Started</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
