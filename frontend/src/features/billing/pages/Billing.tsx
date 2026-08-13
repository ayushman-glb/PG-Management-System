import { useState } from "react";
import {
  Search,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import type { Page } from "@app/App";
import { useTheme } from "@theme/index";
import { FintechCardCarousel } from "../components/FintechCardCarousel";
import { PayRentModal } from "../components/PayRentModal";
import { SpendBreakdownChart } from "../components/SpendBreakdownChart";
import { TransactionTimeline } from "../components/TransactionTimeline";
import { useAdaptiveLoading } from "../../../hooks/useAdaptiveLoading";
import { BillingSkeleton } from "@components/Skeletons";

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
  const [selectedPayAmount, setSelectedPayAmount] = useState(8500);
  const { darkMode } = useTheme();

  const { showSkeleton } = useAdaptiveLoading(
    async () => {
      return invoices;
    },
    []
  );

  if (showSkeleton) {
    return <BillingSkeleton />;
  }

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
              label: "Collection Efficiency",
              value: "94.2%",
              icon: TrendingUp,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-2xl border ${
                darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {stat.label}
                </span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p
                className={`text-xl font-black mt-2 ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200/20">
          {(["overview", "invoices", "transactions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? "border-amber-500 text-amber-500"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <FintechCardCarousel onSelectCardAmount={(amt) => setSelectedPayAmount(amt)} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendBreakdownChart />
              <TransactionTimeline />
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div
            className={`rounded-2xl border overflow-hidden ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
            }`}
          >
            <div className="p-4 border-b border-slate-200/20 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resident or invoice..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                    darkMode
                      ? "bg-[#1D1B1A] border-[#4A443F] text-white"
                      : "bg-[#FFF8F2] border-[#E6D7CA] text-slate-900"
                  }`}
                />
              </div>

              <div className="flex gap-2">
                {(["all", "paid", "due", "late"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      filter === f
                        ? "bg-amber-500 text-black shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-bold tracking-wider border-b ${
                    darkMode ? "bg-[#2B2725] border-[#4A443F] text-slate-400" : "bg-[#FFF8F2] border-[#E6D7CA] text-slate-500"
                  }`}
                >
                  <tr>
                    <th className="p-3.5">Invoice ID</th>
                    <th className="p-3.5">Resident</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">PG</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-amber-500/5 transition-colors ${
                        darkMode ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold">{inv.id}</td>
                      <td className="p-3.5 font-semibold">{inv.resident}</td>
                      <td className="p-3.5">{inv.room}</td>
                      <td className="p-3.5">{inv.pg}</td>
                      <td className="p-3.5 font-bold">₹{inv.amount.toLocaleString()}</td>
                      <td className="p-3.5">{inv.due}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            inv.status === "Paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : inv.status === "Due"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && <TransactionTimeline />}
      </div>

      <PayRentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        defaultAmount={selectedPayAmount}
      />
    </DashboardLayout>
  );
}
