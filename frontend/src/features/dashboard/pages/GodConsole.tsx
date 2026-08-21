import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Building2,
  Users,
  BedDouble,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Building,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { Page } from "../../../App";
import { useTheme } from "../../../theme";
import { useAuth } from "@hooks/useAuth";
import { Logo } from "../../../components/ui/Logo";
import { ThemeToggle } from "../../../theme";
import {
  godService,
  GodOverviewData,
  GodOwnerItem,
  GodOwnerDetail,
  GodResidentItem,
} from "../../../services/god.service";

interface Props {
  navigate: (p: Page) => void;
}

type TabType = "overview" | "owners" | "residents" | "revenue" | "system";

const TIER_COLORS: Record<string, string> = {
  STARTER: "#60A5FA",
  PROFESSIONAL: "#C89A4B",
  BUSINESS: "#A855F7",
  ENTERPRISE: "#10B981",
};

export default function GodConsole({ navigate }: Props) {
  const { logout } = useAuth();
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Overview data
  const [overview, setOverview] = useState<GodOverviewData | null>(null);

  // Owners table data
  const [owners, setOwners] = useState<GodOwnerItem[]>([]);
  const [ownersPagination, setOwnersPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [ownerSearch, setOwnerSearch] = useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [ownerDetail, setOwnerDetail] = useState<GodOwnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Residents table data
  const [residents, setResidents] = useState<GodResidentItem[]>([]);
  const [residentsPagination, setResidentsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [residentSearch, setResidentSearch] = useState<string>("");

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await godService.getOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load platform overview. Please check network connectivity.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOwners = useCallback(async (page = 1, search = ownerSearch) => {
    try {
      const res = await godService.getOwners({ page, limit: 10, search });
      setOwners(res.owners);
      setOwnersPagination(res.pagination);
    } catch (err: any) {
      console.error("Failed to load owners:", err);
    }
  }, [ownerSearch]);

  const loadResidents = useCallback(async (page = 1, search = residentSearch) => {
    try {
      const res = await godService.getResidents({ page, limit: 10, search });
      setResidents(res.residents);
      setResidentsPagination(res.pagination);
    } catch (err: any) {
      console.error("Failed to load residents:", err);
    }
  }, [residentSearch]);

  const loadOwnerDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setSelectedOwnerId(id);
      const detail = await godService.getOwnerById(id);
      setOwnerDetail(detail);
    } catch (err: any) {
      alert("Failed to load owner detail: " + (err?.message || "Unknown error"));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "owners") {
      loadOwners(1);
    } else if (activeTab === "residents") {
      loadResidents(1);
    }
  }, [activeTab, loadOwners, loadResidents]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#141211] text-[#F7F3EE]" : "bg-[#FAF7F2] text-[#2C221E]"}`}>
      {/* Top God Navigation Bar */}
      <header className={`sticky top-0 z-40 px-4 md:px-8 py-3 border-b backdrop-blur-xl flex items-center justify-between ${
        darkMode ? "bg-[#1C1917]/90 border-[#38332E]" : "bg-[#FFFDFB]/90 border-[#E8DFD8]"
      }`}>
        <div className="flex items-center gap-4">
          <Logo onClick={() => navigate("landing")} badge="GOD" />
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Master Console</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          {[
            { id: "overview", label: "Executive KPI", icon: Activity },
            { id: "owners", label: "PG Owners", icon: Building2 },
            { id: "residents", label: "Residents", icon: Users },
            { id: "revenue", label: "SaaS Revenue", icon: DollarSign },
            { id: "system", label: "Health & Audit", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? darkMode
                      ? "bg-[#C89A4B] text-[#141211] font-bold shadow-md shadow-[#C89A4B]/20"
                      : "bg-[#2C221E] text-white font-bold shadow-md"
                    : darkMode
                    ? "text-neutral-400 hover:text-white hover:bg-white/5"
                    : "text-neutral-600 hover:text-black hover:bg-black/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* User profile & controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => loadOverview()}
            title="Refresh Metrics"
            className={`p-2 rounded-xl border transition-colors ${
              darkMode ? "border-[#38332E] hover:bg-[#25211E] text-neutral-300" : "border-[#E8DFD8] hover:bg-neutral-100 text-neutral-700"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate("auth");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              darkMode
                ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                : "border-rose-300 text-rose-600 hover:bg-rose-50"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Error State with Retry Button */}
        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm font-medium text-rose-400">{error}</p>
            </div>
            <button
              onClick={loadOverview}
              className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !overview && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-32 rounded-2xl ${darkMode ? "bg-[#25211E]" : "bg-neutral-200"}`} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`h-80 lg:col-span-2 rounded-2xl ${darkMode ? "bg-[#25211E]" : "bg-neutral-200"}`} />
              <div className={`h-80 rounded-2xl ${darkMode ? "bg-[#25211E]" : "bg-neutral-200"}`} />
            </div>
          </div>
        )}

        {/* Tab 1: Executive KPI / Overview */}
        {overview && activeTab === "overview" && (
          <div className="space-y-6">
            {/* Bento Grid Top Row - Key Platform Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* PG Owners */}
              <div className={`p-5 rounded-2xl border transition-all ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Total PG Owners</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{overview.totalOwners.toLocaleString()}</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18% platform onboarding YoY</span>
                </div>
              </div>

              {/* Total Residents */}
              <div className={`p-5 rounded-2xl border transition-all ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Platform Residents</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{overview.totalResidents.toLocaleString()}</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                  <span>Across {overview.totalProperties} registered properties</span>
                </div>
              </div>

              {/* Total Beds & Occupancy */}
              <div className={`p-5 rounded-2xl border transition-all ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Beds & Occupancy</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <BedDouble className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{overview.occupancyRate}%</div>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                  <span>{overview.occupiedBeds} occupied</span>
                  <span>{overview.availableBeds} available</span>
                </div>
              </div>

              {/* Monthly SaaS Revenue */}
              <div className={`p-5 rounded-2xl border transition-all ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Monthly SaaS MRR</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-amber-500">
                  ₹{overview.monthlySaaSRevenue.toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                  <span>ARR: ₹{(overview.annualRunRate / 100000).toFixed(1)}L</span>
                  <span className="text-emerald-500 font-semibold">{overview.activeSubscriptions} Active Subs</span>
                </div>
              </div>
            </div>

            {/* Bento Grid Middle Row - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Growth Trend Area Chart */}
              <div className={`lg:col-span-2 p-6 rounded-2xl border ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-base">Platform Revenue Velocity</h3>
                    <p className="text-xs text-neutral-400">Monthly SaaS subscription earnings curve</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Growth: +24.6%
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.growthTrends}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C89A4B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#C89A4B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? "#1C1917" : "#FFFDFB",
                          borderColor: darkMode ? "#38332E" : "#E8DFD8",
                          borderRadius: 12,
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#C89A4B" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subscriptions by Tier Pie/Bar Chart */}
              <div className={`p-6 rounded-2xl border ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base">Plan Tier Distribution</h3>
                  <span className="text-xs font-semibold text-neutral-400">Active Licenses</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.subscriptionsByTier || []}
                        dataKey="count"
                        nameKey="tier"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {(overview.subscriptionsByTier || []).map((entry) => (
                          <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "#C89A4B"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? "#1C1917" : "#FFFDFB",
                          borderColor: darkMode ? "#38332E" : "#E8DFD8",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  {(overview.subscriptionsByTier || []).map((t) => (
                    <div key={t.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[t.tier] }} />
                        <span className="font-medium">{t.tier}</span>
                      </div>
                      <div className="font-bold">
                        {t.count} ({((t.count / Math.max(1, overview.activeSubscriptions || 1)) * 100).toFixed(0)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Grid Bottom Row - System Health & Verification Queue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <div className="flex items-center gap-3 mb-2 text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-bold text-sm">System Health</h4>
                </div>
                <div className="text-2xl font-extrabold">{overview.systemMetrics?.systemHealth || "Optimal"}</div>
                <p className="text-xs text-neutral-400 mt-1">Uptime: {overview.systemMetrics?.uptime || "99.98%"}</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <div className="flex items-center gap-3 mb-2 text-amber-500">
                  <Clock className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Owner KYC Queue</h4>
                </div>
                <div className="text-2xl font-extrabold">{overview.systemMetrics?.pendingKycCount ?? 0} Pending</div>
                <button
                  onClick={() => setActiveTab("owners")}
                  className="text-xs text-amber-500 font-semibold mt-1 flex items-center gap-1 hover:underline"
                >
                  Review verification queue <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <div className="flex items-center gap-3 mb-2 text-purple-500">
                  <Building className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Property Approvals</h4>
                </div>
                <div className="text-2xl font-extrabold">{overview.systemMetrics?.pendingPropertyApprovals ?? 0} Submitted</div>
                <p className="text-xs text-neutral-400 mt-1">Waiting for draft clearance</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PG Owner Registry */}
        {activeTab === "owners" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">PG Owner Directory</h2>
                <p className="text-xs text-neutral-400">All registered facility operators, subscription tiers, and capacities</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 sm:w-72 ${
                  darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"
                }`}>
                  <Search className="w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={ownerSearch}
                    onChange={(e) => {
                      setOwnerSearch(e.target.value);
                      loadOwners(1, e.target.value);
                    }}
                    placeholder="Search by owner, email, phone..."
                    className="bg-transparent text-xs w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Owners Table */}
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? "bg-[#25211E] border-[#38332E] text-neutral-400" : "bg-neutral-50 border-[#E8DFD8] text-neutral-600"
                  }`}>
                    <tr>
                      <th className="p-4">Owner & Entity</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">City</th>
                      <th className="p-4">KYC Status</th>
                      <th className="p-4">Plan Tier</th>
                      <th className="p-4">Properties / Beds</th>
                      <th className="p-4">Occupancy</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#38332E]/40 dark:divide-[#38332E]/40">
                    {owners.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-neutral-400">
                          No PG owners found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      owners.map((o) => (
                        <tr key={o.id} className="hover:bg-amber-500/5 transition-colors">
                          <td className="p-4">
                            <div className="font-bold">{o.name}</div>
                            <div className="text-[11px] text-neutral-400">{o.businessName}</div>
                          </td>
                          <td className="p-4">
                            <div>{o.email}</div>
                            <div className="text-[11px] text-neutral-400">{o.phone}</div>
                          </td>
                          <td className="p-4 font-medium">{o.city}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.kycStatus === "APPROVED" || o.kycStatus === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : o.kycStatus === "PENDING"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            }`}>
                              {o.kycStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: TIER_COLORS[o.subscriptionTier] || "#C89A4B" }}
                            >
                              {o.subscriptionTier}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">{o.propertiesCount} PGs</div>
                            <div className="text-[11px] text-neutral-400">{o.totalBeds} total beds</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold">{o.occupancyRate}%</div>
                            <div className="text-[11px] text-neutral-400">{o.totalResidents} residents</div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => loadOwnerDetail(o.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" /> Drilldown
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="p-4 border-t flex items-center justify-between text-xs text-neutral-400">
                <span>Showing {owners.length} of {ownersPagination.total} owners</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={ownersPagination.page <= 1}
                    onClick={() => loadOwners(ownersPagination.page - 1)}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {ownersPagination.page} of {ownersPagination.totalPages || 1}</span>
                  <button
                    disabled={ownersPagination.page >= ownersPagination.totalPages}
                    onClick={() => loadOwners(ownersPagination.page + 1)}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Platform-Wide Resident Directory */}
        {activeTab === "residents" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Platform Resident Registry</h2>
                <p className="text-xs text-neutral-400">All active and onboarded tenants across all PG facilities</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-72 ${
                darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"
              }`}>
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={residentSearch}
                  onChange={(e) => {
                    setResidentSearch(e.target.value);
                    loadResidents(1, e.target.value);
                  }}
                  placeholder="Search resident, code, room..."
                  className="bg-transparent text-xs w-full focus:outline-none"
                />
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? "bg-[#25211E] border-[#38332E] text-neutral-400" : "bg-neutral-50 border-[#E8DFD8] text-neutral-600"
                  }`}>
                    <tr>
                      <th className="p-4">Resident & Code</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Facility Name</th>
                      <th className="p-4">Room & Bed</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Rent Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#38332E]/40 dark:divide-[#38332E]/40">
                    {residents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400">
                          No residents found matching search query.
                        </td>
                      </tr>
                    ) : (
                      residents.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-500/5 transition-colors">
                          <td className="p-4">
                            <div className="font-bold">{r.name}</div>
                            <div className="text-[11px] text-amber-500 font-mono">{r.residentCode}</div>
                          </td>
                          <td className="p-4">
                            <div>{r.email}</div>
                            <div className="text-[11px] text-neutral-400">{r.phone}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">{r.pgName}</div>
                            <div className="text-[11px] text-neutral-400">{r.city}</div>
                          </td>
                          <td className="p-4 font-mono font-medium">
                            Room {r.roomNumber} ({r.bedNumber})
                          </td>
                          <td className="p-4 font-medium">{r.ownerName}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-neutral-300">
                            {r.rentDueDate ? new Date(r.rentDueDate).toLocaleDateString() : "5th of month"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t flex items-center justify-between text-xs text-neutral-400">
                <span>Showing {residents.length} of {residentsPagination.total} residents</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={residentsPagination.page <= 1}
                    onClick={() => loadResidents(residentsPagination.page - 1)}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {residentsPagination.page} of {residentsPagination.totalPages || 1}</span>
                  <button
                    disabled={residentsPagination.page >= residentsPagination.totalPages}
                    onClick={() => loadResidents(residentsPagination.page + 1)}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SaaS Platform Revenue Analytics */}
        {overview && activeTab === "revenue" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <span className="text-xs font-semibold text-neutral-400 uppercase">Monthly SaaS MRR</span>
                <div className="text-3xl font-extrabold text-amber-500 mt-2">₹{overview.monthlySaaSRevenue.toLocaleString()}</div>
                <p className="text-xs text-neutral-400 mt-1">Direct B2B recurring subscriptions</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <span className="text-xs font-semibold text-neutral-400 uppercase">Annual Run Rate (ARR)</span>
                <div className="text-3xl font-extrabold text-emerald-500 mt-2">₹{(overview.annualRunRate / 100000).toFixed(2)} Lakhs</div>
                <p className="text-xs text-neutral-400 mt-1">Extrapolated 12-month platform value</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
                <span className="text-xs font-semibold text-neutral-400 uppercase">Lifetime Platform Revenue</span>
                <div className="text-3xl font-extrabold text-purple-400 mt-2">₹{(overview.totalPlatformRevenue / 100000).toFixed(2)} Lakhs</div>
                <p className="text-xs text-neutral-400 mt-1">Cumulative SaaS billing</p>
              </div>
            </div>

            {/* Revenue by Tier Table */}
            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
              <h3 className="font-bold text-base mb-4">Subscription Tier Unit Economics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-bold uppercase ${
                    darkMode ? "text-neutral-400 border-[#38332E]" : "text-neutral-600 border-[#E8DFD8]"
                  }`}>
                    <tr>
                      <th className="p-3">Tier Plan</th>
                      <th className="p-3">Monthly Price / Owner</th>
                      <th className="p-3">Active Subscribers</th>
                      <th className="p-3">Monthly Run-rate</th>
                      <th className="p-3">Annualized Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#38332E]/30">
                    {overview.subscriptionsByTier.map((t) => (
                      <tr key={t.tier}>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TIER_COLORS[t.tier] }} />
                          {t.tier}
                        </td>
                        <td className="p-3 font-mono">₹{t.monthlyPrice.toLocaleString()}/mo</td>
                        <td className="p-3 font-bold">{t.count} owners</td>
                        <td className="p-3 font-mono text-amber-500 font-semibold">₹{t.totalRevenue.toLocaleString()}/mo</td>
                        <td className="p-3 font-mono text-emerald-500 font-semibold">₹{(t.totalRevenue * 12).toLocaleString()}/yr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Health & System Diagnostics */}
        {overview && activeTab === "system" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-[#1C1917] border-[#38332E]" : "bg-white border-[#E8DFD8]"}`}>
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Platform System Diagnostics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                  <span className="font-semibold text-neutral-400">Database Engine</span>
                  <div className="text-sm font-bold mt-1 text-emerald-400">MongoDB ReplicaSet (Atlas Primary + Secondary)</div>
                  <div className="mt-2 text-neutral-400">Latency: 12ms avg | Pool: 25 active connections</div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                  <span className="font-semibold text-neutral-400">Real-Time Socket Gateway</span>
                  <div className="text-sm font-bold mt-1 text-blue-400">Socket.IO v4 Engine Operational</div>
                  <div className="mt-2 text-neutral-400">Rooms: GOD_ROOM, OWNER_ROOMS, RESIDENT_ROOMS</div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                  <span className="font-semibold text-neutral-400">Zero-Trust JWT Engine</span>
                  <div className="text-sm font-bold mt-1 text-purple-400">RS256 Private-Key Signed Tokens</div>
                  <div className="mt-2 text-neutral-400">Automatic TokenVersion revocation & Risk engine active</div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                  <span className="font-semibold text-neutral-400">Payment Gateway Integration</span>
                  <div className="text-sm font-bold mt-1 text-amber-400">Razorpay Orders & Webhook Signatures</div>
                  <div className="mt-2 text-neutral-400">HMAC-SHA256 verification enabled on all webhooks</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Owner Detail Drilldown Modal */}
      <AnimatePresence>
        {selectedOwnerId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-4xl w-full max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
                darkMode ? "bg-[#1C1917] border-[#38332E] text-white" : "bg-white border-[#E8DFD8] text-[#2C221E]"
              }`}
            >
              {/* Modal Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ownerDetail?.owner.name || "Loading Owner Profile..."}</h3>
                    <p className="text-xs text-neutral-400">{ownerDetail?.business.legalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOwnerId(null);
                    setOwnerDetail(null);
                  }}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {detailLoading || !ownerDetail ? (
                  <div className="py-16 text-center animate-pulse">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                    <p className="text-neutral-400">Fetching comprehensive owner profile & tenant records...</p>
                  </div>
                ) : (
                  <>
                    {/* Entity & KYC Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                        <span className="font-bold uppercase tracking-wider text-neutral-400">Account Details</span>
                        <div className="mt-2 space-y-1">
                          <p><span className="text-neutral-400">Email:</span> {ownerDetail.owner.email}</p>
                          <p><span className="text-neutral-400">Phone:</span> {ownerDetail.owner.phone}</p>
                          <p><span className="text-neutral-400">Status:</span> <span className="font-bold text-emerald-400">{ownerDetail.owner.accountStatus}</span></p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                        <span className="font-bold uppercase tracking-wider text-neutral-400">Tax & Business</span>
                        <div className="mt-2 space-y-1">
                          <p><span className="text-neutral-400">GSTIN:</span> <span className="font-mono">{ownerDetail.business.gstin}</span></p>
                          <p><span className="text-neutral-400">PAN:</span> <span className="font-mono">{ownerDetail.business.panNumber}</span></p>
                          <p><span className="text-neutral-400">City:</span> {ownerDetail.business.city}, {ownerDetail.business.state}</p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                        <span className="font-bold uppercase tracking-wider text-neutral-400">Subscription</span>
                        <div className="mt-2 space-y-1">
                          <p><span className="text-neutral-400">Tier:</span> <span className="font-bold text-amber-500">{ownerDetail.subscription.planType}</span></p>
                          <p><span className="text-neutral-400">Fee:</span> ₹{ownerDetail.subscription.monthlyCost}/mo</p>
                          <p><span className="text-neutral-400">Renews:</span> {new Date(ownerDetail.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Properties List */}
                    <div>
                      <h4 className="font-bold text-sm mb-3">Managed PG Properties ({ownerDetail.properties.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ownerDetail.properties.map((pg) => (
                          <div key={pg.id} className={`p-4 rounded-2xl border ${darkMode ? "bg-[#25211E] border-[#38332E]" : "bg-neutral-50 border-[#E8DFD8]"}`}>
                            <div className="font-bold text-sm">{pg.name}</div>
                            <div className="text-neutral-400 mt-0.5">{pg.address}, {pg.city}</div>
                            <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-neutral-300">
                              <span>Capacity: {pg.capacity} beds</span>
                              <span>Occupancy: {pg.currentOccupancy} residents</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Residents Living Under this Owner */}
                    <div>
                      <h4 className="font-bold text-sm mb-3">Active Residents ({ownerDetail.residents.length})</h4>
                      <div className="rounded-2xl border overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className={`border-b ${darkMode ? "bg-[#25211E] border-[#38332E] text-neutral-400" : "bg-neutral-100 border-[#E8DFD8]"}`}>
                            <tr>
                              <th className="p-2.5">Resident</th>
                              <th className="p-2.5">Code</th>
                              <th className="p-2.5">PG / Room</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#38332E]/30">
                            {ownerDetail.residents.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-neutral-400">
                                  No residents currently assigned under this owner's properties.
                                </td>
                              </tr>
                            ) : (
                              ownerDetail.residents.map((r) => (
                                <tr key={r.id}>
                                  <td className="p-2.5 font-medium">{r.name}</td>
                                  <td className="p-2.5 font-mono text-amber-500">{r.residentCode}</td>
                                  <td className="p-2.5">{r.pgName} — Rm {r.roomNumber}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-bold">
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
