import { useState } from "react";
import {
  Search,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";
import { useTheme } from "../theme";

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
  {
    id: "INV-2025-006",
    resident: "Divya Reddy",
    room: "308B",
    amount: 14000,
    due: "5 Jul 2025",
    status: "Paid",
    pg: "Urban Nest",
  },
  {
    id: "INV-2025-007",
    resident: "Kiran Rao",
    room: "412A",
    amount: 11500,
    due: "5 Jul 2025",
    status: "Due",
    pg: "Sunrise PG",
  },
  {
    id: "INV-2025-008",
    resident: "Priya Sharma",
    room: "106C",
    amount: 10000,
    due: "5 Jul 2025",
    status: "Paid",
    pg: "Green Valley",
  },
];

const transactions = [
  {
    id: "TXN-8821",
    resident: "Ankit Joshi",
    amount: 12000,
    method: "UPI",
    date: "2 Jul 2025",
    status: "Success",
  },
  {
    id: "TXN-8820",
    resident: "Divya Reddy",
    amount: 14000,
    method: "Card",
    date: "2 Jul 2025",
    status: "Success",
  },
  {
    id: "TXN-8819",
    resident: "Priya Sharma",
    amount: 10000,
    method: "NetBanking",
    date: "1 Jul 2025",
    status: "Success",
  },
  {
    id: "TXN-8818",
    resident: "Kavya Nair",
    amount: 13500,
    method: "UPI",
    date: "1 Jul 2025",
    status: "Success",
  },
  {
    id: "TXN-8817",
    resident: "Meera Pillai",
    amount: 10500,
    method: "UPI",
    date: "30 Jun 2025",
    status: "Success",
  },
];

export default function Billing({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<"invoices" | "transactions">(
    "invoices",
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "due" | "late">("all");
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
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Billing &amp; Payments
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Manage invoices, reminders, and transaction history
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`flex items-center gap-2 border text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <Send className="w-4 h-4" />
              Send Reminders
            </button>
            <button
              type="button"
              className="flex items-center gap-2 luxury-btn-primary text-sm font-semibold px-4 py-2.5 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Summary cards */}
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
                className={`glass-panel glass-card-hover rounded-2xl p-4 md:p-5 border ${s.bg}`}
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

        {/* Tabs & Table */}
        <div
          className="glass-panel rounded-2xl overflow-hidden border border-[#E6D7CA]/80 dark:border-[#4A443F]/80 shadow-xl"
        >
          <div
            className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}
          >
            <div
              className={`flex gap-1 p-1 rounded-xl ${darkMode ? "bg-slate-900/50" : "bg-slate-100"}`}
            >
              {(["invoices", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? darkMode
                        ? "bg-slate-700 text-white shadow-sm"
                        : "bg-white shadow-sm text-slate-900"
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
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}
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
                    className={`bg-transparent text-sm outline-none placeholder:text-slate-400 w-36 ${darkMode ? "text-white" : "text-slate-700"}`}
                  />
                </div>
                <div className="mobile-scroll-x flex max-w-full gap-1.5">
                  {(["all", "paid", "due", "late"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      aria-pressed={filter === f}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        filter === f
                          ? "luxury-btn-primary text-white"
                          : darkMode
                            ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
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

          {activeTab === "invoices" && (
            <div className="overflow-x-auto mobile-scroll-x">
              <table className="w-full min-w-[700px]">
                <thead
                  className={darkMode ? "bg-slate-900/50" : "bg-slate-50"}
                >
                  <tr
                    className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-400"}`}
                  >
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
                <tbody
                  className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-50"}`}
                >
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                    >
                      <td className={`px-6 py-3.5 text-sm font-mono ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}>
                        {inv.id}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                          >
                            {inv.resident
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span
                            className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {inv.resident}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {inv.pg}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {inv.room}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                        >
                          ₹{inv.amount.toLocaleString()}
                        </span>
                        {inv.lateFee && (
                          <span className="text-xs text-red-500 ml-1">
                            +₹{inv.lateFee}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
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
                          <button className={`text-xs hover:underline font-medium ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}>
                            View
                          </button>
                          {inv.status !== "Paid" && (
                            <button
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${darkMode ? "bg-[#332D2B] text-[#C89A4B] hover:bg-[#3E3735]" : "bg-[#F8EEE5] text-[#C58B63] hover:bg-[#EAE0D5]"}`}
                            >
                              Send Reminder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead
                  className={darkMode ? "bg-slate-900/50" : "bg-slate-50"}
                >
                  <tr
                    className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-400"}`}
                  >
                    <th className="text-left px-6 py-3">Transaction ID</th>
                    <th className="text-left px-6 py-3">Resident</th>
                    <th className="text-left px-6 py-3">Amount</th>
                    <th className="text-left px-6 py-3">Method</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-50"}`}
                >
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      className={`transition-colors ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                    >
                      <td className={`px-6 py-3.5 text-sm font-mono ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}>
                        {t.id}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {t.resident}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                      >
                        ₹{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            darkMode ? "bg-[#332D2B] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"
                          }`}
                        >
                          {t.method}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {t.date}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
