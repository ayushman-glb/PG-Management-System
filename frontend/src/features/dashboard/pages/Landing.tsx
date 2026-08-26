import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Menu,
  X,
  ChevronRight,
  User,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle } from "@theme/index";
import { Logo } from "@components/ui/Logo";
import { Button } from "@components/ui/Button";
import { SearchPill } from "@components/ui/SearchPill";
import { CategoryStrip } from "@components/ui/CategoryStrip";
import { PropertyCard, PropertyCardData } from "@components/ui/PropertyCard";
import { NewBadge } from "@components/ui/NewBadge";
import { SpotlightCard } from "@components/animations/MotionPrimitives";
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] font-sans relative overflow-x-clip transition-colors">
      {/* ─── Top Navigation ─────────────────────────── */}
      <header className="sticky top-0 left-0 right-0 z-50 h-20 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex-shrink-0">
            <Logo onClick={() => navigate("landing")} size="md" />
          </div>

          {/* Center: 3-Product Navigation Tabs */}
          <nav aria-label="Product categories" className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              type="button"
              onClick={() => setActiveProductTab("homes")}
              className={`relative py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeProductTab === "homes"
                  ? "text-[var(--text-main)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Homes & PGs
              {activeProductTab === "homes" && (
                <motion.span
                  layoutId="landingNavTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--brand-primary)] rounded-full"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
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
                  ? "text-[var(--text-main)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Co-Living Hubs
              {activeProductTab === "coliving" && (
                <motion.span
                  layoutId="landingNavTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--brand-primary)] rounded-full"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveProductTab("services")}
              className={`relative py-2 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeProductTab === "services"
                  ? "text-[var(--text-main)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <span>Services</span>
              <NewBadge className="ml-1" />
              {activeProductTab === "services" && (
                <motion.span
                  layoutId="landingNavTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--brand-primary)] rounded-full"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
            </button>
          </nav>

          {/* Right: Host CTA, Globe, Theme, User Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => navigate("auth")}
              className="hidden lg:block text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors cursor-pointer"
            >
              RoomBae your property
            </button>

            <ThemeToggle />

            {/* User Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-[var(--border-main)] hover:shadow-md transition-all cursor-pointer bg-[var(--bg-card)]"
                aria-label="User navigation menu"
              >
                <Menu className="w-4 h-4 text-[var(--text-main)]" />
                <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
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
                    className="absolute right-0 top-12 w-64 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl py-2 z-50 text-sm overflow-hidden"
                  >
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
                          <p className="font-bold text-xs text-[var(--text-main)] truncate">{user.name || "Member"}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (rawRole === "RESIDENT") navigate("resident-portal");
                            else if (rawRole === "ADMIN" || rawRole === "SUPER_ADMIN") navigate("admin-console");
                            else navigate("dashboard");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] font-semibold text-[var(--text-main)] flex items-center justify-between cursor-pointer"
                        >
                          <span>{rawRole === "RESIDENT" ? "Resident Portal" : "Management Dashboard"}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("pg-listing"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          Explore All PGs
                        </button>
                        <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                        <button
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            await logout();
                            navigate("auth");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] text-rose-600 font-medium cursor-pointer"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] font-bold text-[var(--text-main)] cursor-pointer"
                        >
                          Sign up
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] text-[var(--text-main)] cursor-pointer"
                        >
                          Log in
                        </button>
                        <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("pg-listing"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          Find PGs & Co-Living
                        </button>
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate("auth"); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
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

      {/* ─── Hero Section with Staggered Entrance ─────────────── */}
      <section className="pt-8 pb-10 px-4 md:px-6 bg-[var(--bg-primary)] transition-colors">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 text-xs font-semibold mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Co-Living Marketplace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-clamp-hero font-bold tracking-tight text-[var(--text-main)] mb-6"
          >
            Find premium PGs & Co-Living spaces.
          </motion.h1>

          {/* Centered Search Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto mb-8"
          >
            <SearchPill onSearch={() => navigate("pg-listing")} />
          </motion.div>
        </div>
      </section>

      {/* ─── Category Filter Strip ─────────────────── */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          if (id !== "all") navigate("pg-listing");
        }}
        onOpenFilters={() => navigate("pg-listing")}
      />

      {/* ─── Photo-First Property Grid ─────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-main)]">
              Trending stays across top tech hubs
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Verified luxury & student co-living spaces with premium amenities
            </p>
          </div>
          <button
            onClick={() => navigate("pg-listing")}
            className="hidden sm:inline-flex items-baseline gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer"
          >
            <span>Show all</span>
            <ChevronRight className="w-4 h-4 self-center" />
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

      {/* ─── Value Props Feature Grid ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
              100% Superhost Verified
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Every PG undergoes rigorous on-ground audits covering food quality, high-speed WiFi uptime, and verified background safety.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-ruby)]/15 text-[var(--accent-ruby)] flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
              Zero-Brokerage Escrow
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Direct owner contracts with transparent rent splits, zero hidden platform fees, and instant security deposit settlement.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-forest)]/15 text-[var(--accent-forest)] flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
              Automated Resident OS
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              One-click digital KYC verification, automated UPI monthly billing, and SLA-guaranteed maintenance complaint resolution.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* ─── Property Owner Conversion Banner ───────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-[var(--brand-primary)]/30">
          <div className="max-w-xl z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)] mb-2 inline-block">
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
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&auto=format";
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── City Directory ───────── */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-12 px-4 md:px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-base font-bold text-[var(--text-main)] mb-6">
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
                className="text-left group cursor-pointer rounded-xl p-2 -m-2 hover:bg-[var(--bg-nested)] transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between w-full">
                  <p className="font-bold text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">
                    {item.city}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--brand-primary)] flex-shrink-0" />
                </div>
                <p className="text-[var(--text-muted)] mt-0.5">{item.count}</p>
                <p className="text-xs text-[var(--text-muted-soft)] truncate mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer & Legal Band ───────────── */}
      <footer className="border-t border-[var(--border-main)] bg-[var(--bg-primary)] pt-12 pb-8 px-4 md:px-6 text-xs text-[var(--text-muted)] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 md:gap-x-12 gap-y-8 pb-10 border-b border-[var(--border-subtle)] justify-start">
            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-3">Support</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("help-center")} className="hover:underline cursor-pointer">Help Center & Support</button></li>
                <li><a href="mailto:support@roombae.com" className="hover:underline">Contact Support Team</a></li>
                <li><a href="tel:+918000492233" className="hover:underline">+91 80004 92233</a></li>
                <li><button onClick={() => navigate("terms-of-service")} className="hover:underline cursor-pointer">Cancellation Options</button></li>
                <li><button onClick={() => navigate("privacy-policy")} className="hover:underline cursor-pointer">Safety Information</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-3">Hosting</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate("auth")} className="hover:underline cursor-pointer">List your PG or Co-Living space</button></li>
                <li><button onClick={() => navigate("documentation")} className="hover:underline cursor-pointer">RoomBae for Property Owners</button></li>
                <li><button onClick={() => navigate("roadmap")} className="hover:underline cursor-pointer">Pricing & Plans</button></li>
                <li><button onClick={() => navigate("blog")} className="hover:underline cursor-pointer">Community Forum & Best Practices</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[var(--text-main)] mb-3">RoomBae</h4>
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

            <div className="flex items-center gap-6 font-semibold text-[var(--text-main)]">
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
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border-main)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)]">
                  Product tour
                </p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text-main)]">
                  See RoomBae in action
                </h2>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                aria-label="Close demo"
                className="rounded-full p-2 text-neutral-400 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video w-full rounded-xl bg-neutral-900 flex items-center justify-center text-white mb-4">
                <Play className="w-12 h-12 text-[var(--brand-primary)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-6">
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
