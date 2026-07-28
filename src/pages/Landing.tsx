import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  Shield,
  Zap,
  Cloud,
  ChevronDown,
  Star,
  Check,
  ArrowRight,
  Play,
  BedDouble,
  MessageSquare,
  UserCheck,
  QrCode,
  Smartphone,
  TrendingUp,
  Package,
  Bot,
  Coffee,
  Menu,
  X,
  Globe,
  Link,
  ExternalLink,
  AtSign,
  DollarSign,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle } from "../theme";

interface Props {
  navigate: (p: Page) => void;
}

const features = [
  {
    icon: Building2,
    title: "Multi PG Management",
    desc: "Manage multiple properties from a single dashboard with unified analytics and controls.",
  },
  {
    icon: BedDouble,
    title: "Room & Bed Management",
    desc: "Real-time bed allocation, availability tracking, and floor-level room visualization.",
  },
  {
    icon: Users,
    title: "Resident Onboarding",
    desc: "Digital onboarding with KYC verification, document upload, and automated welcome workflows.",
  },
  {
    icon: Shield,
    title: "Digital Agreements",
    desc: "E-sign rental agreements with legally binding digital signatures and secure storage.",
  },
  {
    icon: CreditCard,
    title: "Rent Collection",
    desc: "Automated rent reminders, recurring payments, and late fee calculations.",
  },
  {
    icon: DollarSign,
    title: "Online Payments",
    desc: "Accept UPI, cards, net banking. Auto-reconcile with your accounting in real time.",
  },
  {
    icon: QrCode,
    title: "QR Entry",
    desc: "Contactless check-in with QR codes. Visitor logs and resident entry history.",
  },
  {
    icon: MessageSquare,
    title: "Complaint Management",
    desc: "Kanban-style complaint tracking with priority escalation and SLA monitoring.",
  },
  {
    icon: UserCheck,
    title: "Visitor Management",
    desc: "Log and manage visitor entries, pre-approvals, and time-stamped access records.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Revenue trends, occupancy heatmaps, payment graphs, and predictive insights.",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Notifications",
    desc: "Automated rent reminders, payment receipts, and alerts via WhatsApp.",
  },
  {
    icon: Coffee,
    title: "Staff Management",
    desc: "Assign roles, track attendance, manage housekeeping staff and maintenance crew.",
  },
  {
    icon: Package,
    title: "Expense Tracking",
    desc: "Track utilities, repairs, vendor payments and get P&L reports per property.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Vacancy",
    desc: "AI-powered predictions for upcoming vacancies to minimize empty bed losses.",
  },
  {
    icon: Bot,
    title: "Chatbot Support",
    desc: "Automated chatbot for resident queries, complaint logging, and payment status.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "PG Owner, 3 Properties",
    avatar: "PS",
    rating: 5,
    text: "RoomBae transformed how I run my three properties. Rent collection is fully automated now. I save 15+ hours every month.",
    location: "Bengaluru",
  },
  {
    name: "Arjun Mehta",
    role: "Resident, Techie PG",
    avatar: "AM",
    rating: 5,
    text: "The app is incredibly easy to use. I can raise complaints, pay rent, and track my agreement all from one place. Love it!",
    location: "Hyderabad",
  },
  {
    name: "Sunita Rao",
    role: "Property Manager, 8 PGs",
    avatar: "SR",
    rating: 5,
    text: "Analytics alone are worth it. I identified my best-performing property and vacancy patterns I had no idea existed.",
    location: "Pune",
  },
  {
    name: "Vikram Nair",
    role: "PG Owner, 2 Properties",
    avatar: "VN",
    rating: 5,
    text: "Onboarding residents used to take hours with paper forms. Now it is fully digital and takes 10 minutes. Game changer.",
    location: "Chennai",
  },
];

const faqs = [
  {
    q: "How long does setup take?",
    a: "Most owners go live within 24 hours. Our onboarding team helps you migrate existing data and configure your properties step-by-step.",
  },
  {
    q: "Can I manage multiple PGs from one account?",
    a: "Yes. You can manage unlimited PGs under a single account with a unified dashboard and property-level reports.",
  },
  {
    q: "Is my data secure?",
    a: "We use bank-grade 256-bit encryption, SOC 2 certified infrastructure, and daily encrypted backups. Your data is always safe.",
  },
  {
    q: "Do you support online rent payments?",
    a: "Yes — UPI, credit/debit cards, net banking, and wallets are all supported with automatic reconciliation.",
  },
  {
    q: "Is there a mobile app?",
    a: "Our web app is fully responsive and works on any device. Native iOS and Android apps are in active development.",
  },
  {
    q: "What kind of support do you offer?",
    a: "We offer email, WhatsApp, and phone support. Enterprise customers get a dedicated success manager.",
  },
];

const whyUs = [
  {
    icon: Zap,
    title: "Fast Setup",
    desc: "Go live in under 24 hours with guided onboarding.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    desc: "SOC 2 certified, 256-bit encryption, daily backups.",
  },
  {
    icon: Cloud,
    title: "Cloud Hosted",
    desc: "Always available, auto-scaling, zero maintenance.",
  },
  {
    icon: TrendingUp,
    title: "Scalable",
    desc: "Grows with your portfolio — 1 PG or 100 PGs.",
  },
  {
    icon: CreditCard,
    title: "Easy Billing",
    desc: "Automated invoicing, reminders, and reconciliation.",
  },
  {
    icon: Bot,
    title: "Automation First",
    desc: "Reduce manual work by 80% with smart workflows.",
  },
];

const stats = [
  { value: "10,000+", label: "Residents" },
  { value: "500+", label: "PGs" },
  { value: "99.99%", label: "Uptime" },
  { value: "₹50Cr+", label: "Rent Processed" },
];

const logos = [
  "Oyo Rooms",
  "NestAway",
  "Stanza Living",
  "Hello World",
  "Colive",
  "Zolo",
];

export default function Landing({ navigate }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [animateStats, setAnimateStats] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const prices = {
    starter: { monthly: 999, yearly: 799 },
    pro: { monthly: 2499, yearly: 1999 },
    enterprise: { monthly: 4999, yearly: 3999 },
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#3B2A24] font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#E6D7CA]/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4 md:gap-8">
          <button
            type="button"
            onClick={() => navigate("landing")}
            aria-label="Go to RoomBae home"
            className="flex items-center gap-2.5"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)", boxShadow: "0 4px 12px rgba(197,139,99,0.35)" }}
            >
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-[#3B2A24] text-lg">RoomBae</span>
          </button>

          <div className="hidden md:flex items-center gap-7 ml-6">
            {["Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[#6E5A52] hover:text-[#C58B63] font-medium transition-colors"
              >
                {item}
              </a>
            ))}
            <button
              onClick={() => navigate("about")}
              className="text-sm text-[#6E5A52] hover:text-[#C58B63] font-medium transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate("blog")}
              className="text-sm text-[#6E5A52] hover:text-[#C58B63] font-medium transition-colors"
            >
              Blog
            </button>
            <button
              onClick={() => navigate("pg-listing")}
              className="text-sm text-[#6E5A52] hover:text-[#C58B63] font-medium transition-colors"
            >
              Find PGs
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <button
              onClick={() => navigate("auth")}
              className="text-sm font-medium text-[#6E5A52] hover:text-[#C58B63] transition-colors px-4 py-2"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("auth")}
              className="luxury-btn-primary text-sm font-semibold px-5 py-2.5"
            >
              Start Free Trial
            </button>
          </div>

          <ThemeToggle className="md:hidden" />

          <button
            className="ml-auto md:hidden p-2 rounded-lg text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-3">
            {["Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button
              onClick={() => {
                navigate("about");
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium text-slate-700"
            >
              About
            </button>
            <button
              onClick={() => {
                navigate("blog");
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium text-slate-700"
            >
              Blog
            </button>
            <button
              onClick={() => {
                navigate("auth");
                setMobileMenuOpen(false);
              }}
              className="w-full text-sm font-semibold text-white bg-blue-600 px-5 py-2.5 rounded-xl mt-2"
            >
              Start Free Trial
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#F8EEE5] border border-[#E6D7CA] text-[#C58B63] text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-[#D9A87C] rounded-full animate-pulse" />
              Trusted by 500+ Luxury PG Owners across India
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#3B2A24] leading-[1.05] tracking-tight mb-6">
              Manage Every PG.{" "}
              <span className="gradient-text">Every Resident.</span> Every
              Payment.
            </h1>
            <p className="text-lg md:text-xl text-[#6E5A52] max-w-2xl mx-auto leading-relaxed mb-10">
              The boutique PG Management platform for property owners. Manage
              rooms, residents, billing, complaints, analytics and payments from
              one warm, elegant dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("auth")}
                className="flex items-center gap-2.5 luxury-btn-primary px-7 py-3.5 text-base"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDemo(true)}
                className="flex items-center gap-2.5 luxury-btn-secondary px-7 py-3.5 text-base"
              >
                <div className="w-7 h-7 bg-[#F8EEE5] rounded-full flex items-center justify-center">
                  <Play className="w-3 h-3 text-[#C58B63] ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>
            <p className="text-sm text-[#A8907F] mt-5">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="glass rounded-2xl border border-white/80 shadow-2xl shadow-blue-100/50 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-slate-100/80 px-4 py-3 flex items-center gap-2 border-b border-slate-200/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white/80 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-medium">
                  app.pgmanager.in/dashboard
                </div>
              </div>
              {/* Dashboard content */}
              <div className="bg-white p-6 grid grid-cols-12 gap-4">
                {/* Sidebar mini */}
                <div className="col-span-2 hidden md:block">
                  <div className="space-y-1">
                    {[
                      BarChart3,
                      Building2,
                      Users,
                      CreditCard,
                      MessageSquare,
                    ].map((Icon, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs ${i === 0 ? "bg-[#D9A87C] text-white" : "text-slate-400"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {i === 0 && (
                          <span className="font-medium">Dashboard</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main */}
                <div className="col-span-12 md:col-span-10 space-y-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Occupancy",
                        value: "94%",
                        trend: "+3%",
                        color: "text-[#C58B63]",
                        bg: "bg-[#F8EEE5]",
                      },
                      {
                        label: "Revenue",
                        value: "₹4.2L",
                        trend: "+12%",
                        color: "text-[#D9A87C]",
                        bg: "bg-[#F8EEE5]",
                      },
                      {
                        label: "Available Beds",
                        value: "8",
                        trend: "-2",
                        color: "text-teal-600",
                        bg: "bg-teal-50",
                      },
                      {
                        label: "Pending Payments",
                        value: "12",
                        trend: "-5%",
                        color: "text-orange-600",
                        bg: "bg-orange-50",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`${stat.bg} rounded-xl p-3`}
                      >
                        <p className="text-xs text-slate-500 mb-1">
                          {stat.label}
                        </p>
                        <p className={`text-lg font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                        <p className="text-xs text-slate-400">
                          {stat.trend} this month
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-3">
                        Revenue Overview
                      </p>
                      <div className="flex items-end gap-1.5 h-20">
                        {[60, 75, 55, 80, 70, 90, 85, 95, 88, 92, 78, 100].map(
                          (h, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t-md ${i === 11 ? "bg-[#D9A87C]" : "bg-[#E7C4A0]"}`}
                              style={{ height: `${h}%` }}
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <div
                      className="rounded-xl p-3 text-white shadow-md"
                      style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                    >
                      <p className="text-xs font-medium opacity-80 mb-2">
                        Beds Status
                      </p>
                      <div className="relative w-16 h-16 mx-auto">
                        <svg
                          viewBox="0 0 36 36"
                          className="w-full h-full -rotate-90"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="4"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="white"
                            strokeWidth="4"
                            strokeDasharray="83 100"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">94%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-8 top-20 animate-float hidden lg:block">
              <div className="glass rounded-2xl border border-white p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Payment received</p>
                    <p className="text-sm font-bold text-slate-900">₹12,500</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-xs text-green-600 font-medium">Just now</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 top-32 animate-float-delay hidden lg:block">
              <div className="glass rounded-2xl border border-white p-4 shadow-xl">
                <p className="text-xs text-slate-500 mb-1">Occupancy Rate</p>
                <p className="text-2xl font-black text-[#C58B63]">94%</p>
                <p className="text-xs text-slate-400 mt-1">+3% this month</p>
              </div>
            </div>

            <div
              className="absolute -left-4 bottom-12 animate-float hidden lg:block"
              style={{ animationDelay: "2s" }}
            >
              <div className="glass rounded-2xl border border-white p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C58B63]" />
                  <p className="text-xs font-medium text-slate-700">
                    3 complaints resolved today
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-slate-400 font-semibold uppercase tracking-widest mb-8">
            Trusted by leading PG businesses
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-14">
            {logos.map((logo) => (
              <div
                key={logo}
                className="text-slate-300 font-bold text-lg hover:text-slate-400 transition-colors cursor-default"
              >
                {logo}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center py-8 px-6 bg-white rounded-2xl border border-slate-100 shadow-sm card-hover ${animateStats ? "animate-count-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <p className="text-4xl font-black gradient-text mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#F8EEE5] border border-[#E6D7CA] text-[#C58B63] text-xs font-semibold px-4 py-2 rounded-full mb-4">
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
              Built for modern PG management
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Every feature you need to run a professional, scalable PG business
              — in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="feature-card group bg-[#FFFDFB] hover:bg-[#F8EEE5]/50 border border-[#E6D7CA] rounded-2xl p-5 card-hover cursor-default"
                >
                  <div
                    className="feature-icon w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm text-white"
                    style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Powerful dashboards, at a glance
            </h2>
            <p className="text-slate-500 text-lg">
              Everything from revenue charts to occupancy heatmaps — designed
              for clarity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Analytics Overview",
                gradient: "linear-gradient(135deg, #D9A87C 0%, #C58B63 100%)",
                icon: BarChart3,
              },
              {
                label: "Resident Management",
                gradient: "linear-gradient(135deg, #C58B63 0%, #B5743F 100%)",
                icon: Users,
              },
              {
                label: "Revenue Insights",
                gradient: "linear-gradient(135deg, #E7C4A0 0%, #D9A87C 100%)",
                icon: TrendingUp,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  onClick={() => navigate("dashboard")}
                  className="rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg text-white"
                  style={{ background: item.gradient }}
                >
                  <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {item.label}
                  </h3>
                  <p className="text-white/70 text-sm">
                    Click to explore the full dashboard →
                  </p>
                  {/* Mini chart */}
                  <div className="mt-6 flex items-end gap-1 h-12">
                    {[40, 60, 45, 70, 55, 80, 75, 90, 85, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-white/30 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complaint status */}
            <div
              onClick={() => navigate("complaints")}
              className="bg-white border border-[#E6D7CA] rounded-2xl p-6 cursor-pointer hover:border-[#D9A87C] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Complaint Status</h3>
                <span className="text-xs text-[#C58B63] font-medium">
                  View all →
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Pending",
                    count: 8,
                    color: "bg-red-100 text-red-700",
                  },
                  {
                    label: "In Progress",
                    count: 5,
                    color: "bg-yellow-100 text-yellow-700",
                  },
                  {
                    label: "Resolved",
                    count: 23,
                    color: "bg-green-100 text-green-700",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`${s.color} rounded-xl p-4 text-center`}
                  >
                    <p className="text-2xl font-black">{s.count}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resident list */}
            <div
              onClick={() => navigate("residents")}
              className="bg-white border border-[#E6D7CA] rounded-2xl p-6 cursor-pointer hover:border-[#D9A87C] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Recent Residents</h3>
                <span className="text-xs text-[#C58B63] font-medium">
                  View all →
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: "Ankit Joshi",
                    room: "Room 202A",
                    status: "Active",
                    avatar: "AJ",
                  },
                  {
                    name: "Meera Pillai",
                    room: "Room 104B",
                    status: "Active",
                    avatar: "MP",
                  },
                  {
                    name: "Suresh Babu",
                    room: "Room 301C",
                    status: "Due",
                    avatar: "SB",
                  },
                ].map((r) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                    >
                      {r.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-500">{r.room}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F8EEE5] border border-[#E6D7CA] text-[#C58B63] text-xs font-semibold px-4 py-2 rounded-full mb-6">
                Why RoomBae?
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                Built for how real PG owners actually work
              </h2>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                We talked to 200+ PG owners before writing a single line of
                code. Every feature solves a real pain point.
              </p>
              <button
                onClick={() => navigate("auth")}
                className="flex items-center gap-2 luxury-btn-primary px-6 py-3 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <div className="space-y-0">
                {whyUs.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 pb-8 relative">
                      {i < whyUs.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-100" />
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md text-white z-10"
                        style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="pt-1">
                        <h3 className="font-bold text-slate-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Loved by owners and residents
            </h2>
            <p className="text-slate-500 text-lg">
              Real reviews from real PG businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm card-hover"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.role} · {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg mb-8">
              Start free. Scale as you grow. No hidden fees.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                Yearly
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Starter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 card-hover">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Starter
                </h3>
                <p className="text-slate-500 text-sm">Perfect for 1-2 PGs</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">
                  ₹{prices.starter[billing]}
                </span>
                <span className="text-slate-500 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 30 beds",
                  "Single PG",
                  "Basic analytics",
                  "WhatsApp reminders",
                  "Email support",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <div className="w-4 h-4 bg-[#F8EEE5] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#C58B63]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("auth")}
                className="w-full py-3 rounded-xl border-2 border-[#D9A87C] text-[#C58B63] font-semibold text-sm hover:bg-[#F8EEE5] transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Professional (popular) */}
            <div className="pricing-card-popular rounded-2xl p-8 shadow-2xl shadow-blue-200 -translate-y-4 scale-[1.02]">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <div className="relative mb-6">
                <h3 className="text-lg font-bold text-white mb-1">
                  Professional
                </h3>
                <p className="text-white/70 text-sm">
                  For growing PG businesses
                </p>
              </div>
              <div className="relative mb-8">
                <span className="text-4xl font-black text-white">
                  ₹{prices.pro[billing]}
                </span>
                <span className="text-white/70 text-sm ml-1">/month</span>
              </div>
              <ul className="relative space-y-3 mb-8">
                {[
                  "Up to 150 beds",
                  "Up to 5 PGs",
                  "Advanced analytics",
                  "Online payments",
                  "Digital agreements",
                  "QR entry system",
                  "Priority support",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-white/90"
                  >
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("auth")}
                className="relative w-full py-3 rounded-xl bg-white text-[#C58B63] font-semibold text-sm hover:bg-white/90 transition-colors shadow-md"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 card-hover">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Enterprise
                </h3>
                <p className="text-slate-500 text-sm">For large portfolios</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">
                  ₹{prices.enterprise[billing]}
                </span>
                <span className="text-slate-500 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited beds",
                  "Unlimited PGs",
                  "Custom analytics",
                  "API access",
                  "White-labeling",
                  "Dedicated manager",
                  "24/7 phone support",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <div className="w-4 h-4 bg-[#F8EEE5] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#C58B63]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("auth")}
                className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-slate-500">
              Everything you need to know to get started.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-slate-900 text-sm pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, #D9A87C 0%, #C58B63 100%)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Ready to transform your PG business?
              </h2>
              <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
                Join 500+ PG owners who already save hours every week with PG
                Manager.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate("auth")}
                  className="flex items-center gap-2 bg-[#FFFDFB] text-[#C58B63] font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-all text-base"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("pg-listing")}
                  className="text-white/90 hover:text-white font-semibold text-base transition-colors"
                >
                  Browse PG Listings →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-[#C58B63] mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-lg ml-2.5">
                  RoomBae
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
                The all-in-one platform for modern PG management. Built for
                property owners who want to scale.
              </p>
              <div className="flex items-center gap-3">
                {[Globe, Link, ExternalLink, AtSign].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 bg-slate-100 hover:bg-[#F8EEE5] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#C58B63] transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Company",
                items: [
                  ["About", "about"],
                  ["Blog", "blog"],
                  ["Careers", "careers"],
                  ["Press", "press"],
                ],
              },
              {
                title: "Product",
                items: [
                  ["Features", "features"],
                  ["Pricing", "pricing"],
                  ["Changelog", "changelog"],
                  ["Roadmap", "roadmap"],
                ],
              },
              {
                title: "Resources",
                items: [
                  ["Documentation", "documentation"],
                  ["Help Center", "help-center"],
                  ["API Reference", "api-reference"],
                  ["Status", "status"],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-slate-900 text-sm mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.items.map(([label, destination]) => (
                    <li key={destination}>
                      {destination === "features" ||
                      destination === "pricing" ? (
                        <a
                          href={`#${destination}`}
                          className="text-sm text-slate-500 hover:text-[#C58B63] transition-colors"
                        >
                          {label}
                        </a>
                      ) : (
                        <button
                          onClick={() => navigate(destination as Page)}
                          className="text-sm text-slate-500 hover:text-[#C58B63] transition-colors"
                        >
                          {label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              © 2025 RoomBae. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {[
                ["Privacy Policy", "privacy-policy"],
                ["Terms of Service", "terms-of-service"],
                ["Cookie Policy", "cookie-policy"],
              ].map(([label, destination]) => (
                <button
                  key={destination}
                  onClick={() => navigate(destination as Page)}
                  className="text-xs text-slate-400 hover:text-[#C58B63] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {showDemo && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C58B63]">
                  Product tour
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  See RoomBae in action
                </h2>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                aria-label="Close demo"
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-6 bg-slate-50 p-6 md:grid-cols-[1.2fr_0.8fr]">
              <div
                className="relative aspect-video overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #D9A87C 0%, #C58B63 100%)" }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                    <span>RoomBae</span>
                    <span>Live dashboard preview</span>
                  </div>
                  <div>
                    <p className="text-4xl font-black">94%</p>
                    <p className="mt-1 text-sm text-white/70">
                      Portfolio occupancy
                    </p>
                    <div className="mt-5 flex h-16 items-end gap-1.5">
                      {[45, 62, 50, 75, 68, 88, 80, 96].map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-t-md bg-white/70"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-black text-slate-900">
                  One view for the work that matters.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Track occupancy, collect rent, resolve complaints, and keep
                  residents informed without jumping between spreadsheets.
                </p>
                <button
                  onClick={() => {
                    setShowDemo(false);
                    navigate("auth");
                  }}
                  className="mt-6 flex items-center justify-center gap-2 luxury-btn-primary px-4 py-3 text-sm font-bold flex-shrink-0"
                >
                  Start free trial <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
