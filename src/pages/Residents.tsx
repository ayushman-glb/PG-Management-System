import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  MessageSquare,
  FileText,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { Avatar, AvatarThemeSelector } from "../components/Avatar";
import type { Page } from "../App";
import { useTheme } from "../theme";

interface Props {
  navigate: (p: Page) => void;
}

const residents = [
  {
    id: 1,
    name: "Ankit Joshi",
    email: "ankit@example.com",
    phone: "+91 98765 43210",
    room: "202A",
    pg: "Sunrise PG",
    joined: "15 Jan 2025",
    rent: 12000,
    status: "Active",
    kyc: "Verified",
    avatar: "AJ",
    city: "Bengaluru",
    profession: "Software Engineer",
  },
  {
    id: 2,
    name: "Meera Pillai",
    email: "meera@example.com",
    phone: "+91 87654 32109",
    room: "104B",
    pg: "Green Valley",
    joined: "3 Feb 2025",
    rent: 10500,
    status: "Active",
    kyc: "Verified",
    avatar: "MP",
    city: "Bengaluru",
    profession: "Data Analyst",
  },
  {
    id: 3,
    name: "Suresh Babu",
    email: "suresh@example.com",
    phone: "+91 76543 21098",
    room: "301C",
    pg: "Urban Nest",
    joined: "20 Mar 2025",
    rent: 11000,
    status: "Due",
    kyc: "Verified",
    avatar: "SB",
    city: "Bengaluru",
    profession: "UX Designer",
  },
  {
    id: 4,
    name: "Kavya Nair",
    email: "kavya@example.com",
    phone: "+91 65432 10987",
    room: "205D",
    pg: "Sunrise PG",
    joined: "8 Apr 2025",
    rent: 13500,
    status: "Active",
    kyc: "Pending",
    avatar: "KN",
    city: "Bengaluru",
    profession: "Product Manager",
  },
  {
    id: 5,
    name: "Rohit Sinha",
    email: "rohit@example.com",
    phone: "+91 54321 09876",
    room: "110A",
    pg: "City Heights",
    joined: "12 May 2025",
    rent: 9500,
    status: "Late",
    kyc: "Verified",
    avatar: "RS",
    city: "Bengaluru",
    profession: "Marketing Lead",
  },
  {
    id: 6,
    name: "Divya Reddy",
    email: "divya@example.com",
    phone: "+91 43210 98765",
    room: "308B",
    pg: "Urban Nest",
    joined: "22 Jun 2025",
    rent: 14000,
    status: "Active",
    kyc: "Verified",
    avatar: "DR",
    city: "Bengaluru",
    profession: "Finance Analyst",
  },
];

const timeline = [
  { label: "Moved In", date: "15 Jan 2025", icon: "🏠" },
  { label: "KYC Verified", date: "16 Jan 2025", icon: "✅" },
  { label: "Agreement Signed", date: "17 Jan 2025", icon: "📝" },
  { label: "Feb Rent Paid", date: "5 Feb 2025", icon: "💳" },
  { label: "Complaint Raised", date: "20 Feb 2025", icon: "⚠️" },
  { label: "Mar Rent Paid", date: "3 Mar 2025", icon: "💳" },
];

const paymentHistory = [
  { month: "Jul 2025", amount: 12000, status: "Paid", date: "2 Jul 2025" },
  { month: "Jun 2025", amount: 12000, status: "Paid", date: "1 Jun 2025" },
  { month: "May 2025", amount: 12000, status: "Paid", date: "5 May 2025" },
  { month: "Apr 2025", amount: 12000, status: "Late", date: "12 Apr 2025" },
  { month: "Mar 2025", amount: 12000, status: "Paid", date: "2 Mar 2025" },
];

export default function Residents({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(residents[0]);
  const [showPalette, setShowPalette] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "timeline"
  >("overview");
  const { darkMode } = useTheme();

  const filtered = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout navigate={navigate} activePage="residents">
      <div className="flex h-full flex-col lg:flex-row">
        {/* List panel */}
        <div
          className={`w-full lg:w-96 lg:min-w-[24rem] border-b lg:border-b-0 lg:border-r flex flex-col overflow-hidden ${darkMode ? "border-slate-700" : "border-slate-100"}`}
          style={{ maxHeight: "none" }}
        >
          <div
            className={`p-4 border-b space-y-3 flex-shrink-0 ${darkMode ? "border-slate-700" : "border-slate-100"}`}
          >
            <div className="flex items-center justify-between">
              <h1
                className={`text-lg font-black ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Residents
              </h1>
              <button
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 luxury-btn-primary font-semibold flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Search
                className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-400"}`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search residents..."
                className={`bg-transparent text-sm placeholder:text-slate-400 outline-none flex-1 ${darkMode ? "text-white" : "text-slate-700"}`}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-colors ${darkMode ? "border-slate-600 text-slate-400 hover:bg-slate-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Filter className="w-3 h-3" /> Filter
              </button>
              <button
                onClick={() => setShowPalette(!showPalette)}
                className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  showPalette
                    ? darkMode
                      ? "border-[#C89A4B] text-[#C89A4B] bg-[#332D2B]"
                      : "border-[#D9A87C] text-[#C58B63] bg-[#F8EEE5]"
                    : darkMode
                      ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                🎨 Theme
              </button>
              <button
                className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-colors ${darkMode ? "border-slate-600 text-slate-400 hover:bg-slate-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Download className="w-3 h-3" /> Export
              </button>
              <span
                className={`ml-auto text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}
              >
                {filtered.length} residents
              </span>
            </div>
            {showPalette && (
              <div className="pt-2 animate-fade-in">
                <AvatarThemeSelector />
              </div>
            )}
          </div>

          <div
            className={`flex-1 overflow-y-auto divide-y ${darkMode ? "divide-slate-700/60" : "divide-slate-50"}`}
            style={{ minHeight: 0 }}
          >
            {filtered.map((r) => (
              <motion.button
                key={r.id}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSelected(r)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  selected.id === r.id
                    ? darkMode
                      ? "bg-[#332D2B] border-l-4 border-[#C89A4B]"
                      : "bg-[#F8EEE5] border-l-4 border-[#D9A87C]"
                    : darkMode
                      ? "hover:bg-slate-700/50"
                      : "hover:bg-slate-50"
                }`}
              >
                <Avatar name={r.name} initials={r.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {r.name}
                    </p>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 ml-1 ${
                        selected.id === r.id
                          ? darkMode
                            ? "text-[#C89A4B]"
                            : "text-[#C58B63]"
                          : darkMode
                            ? "text-slate-600"
                            : "text-slate-300"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p
                      className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {r.pg} · Room {r.room}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                        r.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : r.status === "Due"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Profile panel */}
        <div
          className={`flex min-h-[520px] flex-1 flex-col overflow-y-auto ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}
        >
          {/* Header */}
          <div
            className="p-6 md:p-8 text-white shadow-md"
            style={{
              background: darkMode
                ? "linear-gradient(135deg, #C89A4B 0%, #D8B36A 100%)"
                : "linear-gradient(135deg, #D9A87C 0%, #C58B63 100%)"
            }}
          >
            <div className="flex items-start gap-4 md:gap-5">
              <Avatar name={selected.name} initials={selected.avatar} size="2xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-black text-white truncate">
                  {selected.name}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">{selected.profession}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      selected.status === "Active"
                        ? "bg-green-400/20 text-green-200"
                        : selected.status === "Due"
                          ? "bg-orange-400/20 text-orange-200"
                          : "bg-red-400/20 text-red-200"
                    }`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      selected.kyc === "Verified"
                        ? "bg-white/20 text-white/80"
                        : "bg-yellow-400/20 text-yellow-200"
                    }`}
                  >
                    KYC: {selected.kyc}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/60 text-xs">Monthly Rent</p>
                <p className="text-xl md:text-2xl font-black text-white">
                  ₹{selected.rent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div
            className={`border-b px-6 md:px-8 py-3 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center gap-4 md:gap-8 text-sm flex-wrap gap-y-2">
              <div
                className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                <Phone
                  className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                />{" "}
                {selected.phone}
              </div>
              <div
                className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                <Mail
                  className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                />{" "}
                {selected.email}
              </div>
              <div
                className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                <MapPin
                  className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                />{" "}
                {selected.pg} · Room {selected.room}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`border-b px-6 md:px-8 overflow-x-auto ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex gap-6 min-w-max">
              {(["overview", "payments", "timeline"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-semibold capitalize border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? darkMode
                        ? "border-[#C89A4B] text-[#C89A4B]"
                        : "border-[#C58B63] text-[#C58B63]"
                      : darkMode
                        ? "border-transparent text-slate-400 hover:text-slate-200"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-6 md:p-8 ${darkMode ? "bg-slate-900" : ""}`}>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div
                  className={`rounded-2xl border p-5 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                >
                  <h4
                    className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    <FileText className={`w-4 h-4 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`} /> Agreement
                    Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Move-in Date", value: selected.joined },
                      { label: "Lease Term", value: "11 months" },
                      { label: "Agreement Status", value: "Active" },
                      {
                        label: "Security Deposit",
                        value: `₹${(selected.rent * 2).toLocaleString()}`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-4">
                        <span
                          className={darkMode ? "text-slate-400" : "text-slate-500"}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`rounded-2xl border p-5 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                >
                  <h4
                    className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    <CreditCard className={`w-4 h-4 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`} /> Rent
                    Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        label: "Monthly Rent",
                        value: `₹${selected.rent.toLocaleString()}`,
                      },
                      {
                        label: "Total Paid",
                        value: `₹${(selected.rent * 6).toLocaleString()}`,
                      },
                      {
                        label: "Late Fees",
                        value: selected.status === "Late" ? "₹500" : "₹0",
                      },
                      {
                        label: "Balance Due",
                        value:
                          selected.status === "Active"
                            ? "₹0"
                            : `₹${selected.rent.toLocaleString()}`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-4">
                        <span
                          className={darkMode ? "text-slate-400" : "text-slate-500"}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`md:col-span-2 rounded-2xl border p-5 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                >
                  <h4
                    className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    <MessageSquare className={`w-4 h-4 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`} /> Recent
                    Complaints
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        title: "WiFi connectivity issue",
                        date: "20 Feb 2025",
                        status: "Resolved",
                      },
                      {
                        title: "Water supply irregular",
                        date: "15 Apr 2025",
                        status: "Resolved",
                      },
                    ].map((c) => (
                      <div
                        key={c.title}
                        className={`flex items-center justify-between py-2 border-b last:border-0 ${darkMode ? "border-slate-700" : "border-slate-50"}`}
                      >
                        <div>
                          <p
                            className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {c.title}
                          </p>
                          <p
                            className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {c.date}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div
                className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead
                      className={darkMode ? "bg-slate-900/50" : "bg-slate-50"}
                    >
                      <tr
                        className={`text-xs font-semibold uppercase text-slate-400 tracking-wide`}
                      >
                        <th className="text-left px-6 py-3">Month</th>
                        <th className="text-left px-6 py-3">Amount</th>
                        <th className="text-left px-6 py-3">Date Paid</th>
                        <th className="text-left px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-50"}`}
                    >
                      {paymentHistory.map((p) => (
                        <tr
                          key={p.month}
                          className={`transition-colors ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                        >
                          <td
                            className={`px-6 py-3.5 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {p.month}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                          >
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {p.date}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                p.status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-0 max-w-md">
                {timeline.map((t, i) => (
                  <div key={i} className="flex gap-4 pb-6 relative">
                    {i < timeline.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 bottom-0 w-0.5 ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg z-10 flex-shrink-0 ${darkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}
                    >
                      {t.icon}
                    </div>
                    <div className="pt-2">
                      <p
                        className={`font-semibold text-sm ${darkMode ? "text-slate-200" : "text-slate-900"}`}
                      >
                        {t.label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
