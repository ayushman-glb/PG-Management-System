import { useState } from "react";
import {
  Search,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Zap,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import type { Page } from "@app/App";
import { useTheme } from "@theme/index";
import { FintechCardCarousel } from "../components/FintechCardCarousel";
import { PayRentModal } from "../components/PayRentModal";
import { SpendBreakdownChart } from "../components/SpendBreakdownChart";
import { TransactionTimeline } from "../components/TransactionTimeline";

interface Props {
  navigate: (p: Page) => void;
}

const invoices = [
  {
    id: "INV-2025-001",
    resident: "Ankit Joshi",
    room: "202A",
    amount: 12000,
    due: "5 Jul 2025",
    status: "Paid",
    pg: "Sunrise PG",
  },
  {
    id: "INV-2025-002",
    resident: "Meera Pillai",
    room: "104B",
    amount: 10500,
    due: "5 Jul 2025",
    status: "Paid",
    pg: "Green Valley",
  },
  {
    id: "INV-2025-003",
    resident: "Suresh Babu",
    room: "301C",
    amount: 11000,
    due: "5 Jul 2025",
    status: "Due",
    pg: "Urban Nest",
  },
  {
    id: "INV-2025-004",
    resident: "Kavya Nair",
    room: "205D",
    amount: 13500,
    due: "5 Jul 2025",
    status: "Paid",
    pg: "Sunrise PG",
  },
  {
    id: "INV-2025-005",
    resident: "Rohit Sinha",
    room: "110A",
    amount: 9500,
    due: "5 Jul 2025",
    status: "Late",
    pg: "City Heights",
    lateFee: 500,
  },
];

export default function Billing({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "transactions">("overview");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "due" | "late">("all");
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const { darkMode } = useTheme();

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.resident.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const pending = invoices
    .filter((i) => i.status === "Due" || i.status === "Late")
    .reduce((sum, i) => sum + i.amount, 0);
  const lateFees = invoices
    .filter((i) => i.status === "Late")
    .reduce((sum, i) => sum + (i.lateFee || 0), 0);

  return (
    <DashboardLayout navigate={navigate} activePage="billing">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Banking &amp; Payments Hub
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Enterprise Razorpay payment portal, virtual cards &amp; automated rent collection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              1-Tap Pay Rent (Razorpay)
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 border text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <Send className="w-3.5 h-3.5" />
              Send Reminders
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Collected This Month",
              value: `₹${(totalRevenue / 1000).toFixed(1)}K`,
              icon: CheckCircle,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
            },
            {
              label: "Pending Collection",
              value: `₹${(pending / 1000).toFixed(1)}K`,
              icon: Clock,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
            {
              label: "Late Fees Collected",
              value: `₹${lateFees.toLocaleString()}`,
              icon: AlertCircle,
              color: "text-rose-600 dark:text-rose-400",
              bg: "bg-rose-500/10 border-rose-500/20",
            },
            {
              label: "Total Invoices",
              value: invoices.length.toString(),
              icon: CreditCard,
              color: "text-[#C58B63] dark:text-[#C89A4B]",
              bg: "bg-[#D9A87C]/10 border-[#D9A87C]/20",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`glass-panel rounded-2xl p-4 md:p-5 border ${s.bg}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md"
                  >
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <TrendingUp
                    className={`w-4 h-4 ml-auto ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                  />
                </div>
                <p
                  className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  {s.value}
                </p>
                <p
                  className={`text-xs mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-slate-500"}`}
                >
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mockup Fintech Layout Section (Cards + Spend Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FintechCardCarousel onPayClick={() => setIsPayModalOpen(true)} />
          <SpendBreakdownChart />
        </div>

        {/* Main Tabbed Data Panel */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-[#E6D7CA]/80 dark:border-[#4A443F]/80 shadow-xl">
          <div
            className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}
          >
            <div
              className={`flex gap-1 p-1 rounded-2xl ${darkMode ? "bg-slate-900/60" : "bg-slate-100"}`}
            >
              {(["overview", "invoices", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? darkMode
                        ? "bg-[#332D2B] text-white shadow-md border border-[#4A443F]"
                        : "bg-white shadow-md text-slate-900"
                      : darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "invoices" && (
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}
                >
                  <Search
                    className={`w-3.5 h-3.5 ${darkMode ? "text-slate-400" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoices..."
                    aria-label="Search invoices"
                    className={`bg-transparent text-xs outline-none placeholder:text-slate-400 w-36 ${darkMode ? "text-white" : "text-slate-700"}`}
                  />
                </div>
                <div className="flex gap-1.5">
                  {(["all", "paid", "due", "late"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      aria-pressed={filter === f}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        filter === f
                          ? "bg-amber-500 text-black font-bold"
                          : darkMode
                            ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeTab === "overview" && (
            <div className="p-4 md:p-6">
              <TransactionTimeline onPayRetry={() => setIsPayModalOpen(true)} />
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className={darkMode ? "bg-slate-900/50" : "bg-slate-50"}>
                  <tr className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                    <th className="text-left px-6 py-3">Invoice</th>
                    <th className="text-left px-6 py-3">Resident</th>
                    <th className="text-left px-6 py-3">Property</th>
                    <th className="text-left px-6 py-3">Room</th>
                    <th className="text-left px-6 py-3">Amount</th>
                    <th className="text-left px-6 py-3">Due Date</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className={`transition-colors ${darkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}>
                      <td className={`px-6 py-3.5 text-sm font-mono ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}>
                        {inv.id}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                          >
                            {inv.resident.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                            {inv.resident}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {inv.pg}
                      </td>
                      <td className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {inv.room}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                          ₹{inv.amount.toLocaleString()}
                        </span>
                        {inv.lateFee && (
                          <span className="text-xs text-red-500 ml-1">
                            +₹{inv.lateFee}
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {inv.due}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            inv.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : inv.status === "Due"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`https://pg-management-system-boxb.onrender.com/api/v1/billing/invoices/${inv.id}/pdf`, "_blank")}
                            className={`text-xs hover:underline font-medium ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                          >
                            PDF Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="p-4 md:p-6">
              <TransactionTimeline onPayRetry={() => setIsPayModalOpen(true)} />
            </div>
          )}
        </div>
      </div>

      <PayRentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => setActiveTab("overview")}
      />
    </DashboardLayout>
  );
}
