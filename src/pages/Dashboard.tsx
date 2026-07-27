import {
  Building2,
  BedDouble,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";
import { useTheme } from "../theme";

interface Props {
  navigate: (p: Page) => void;
}

const revenueData = [
  { month: "Jan", revenue: 285000, expenses: 95000 },
  { month: "Feb", revenue: 310000, expenses: 102000 },
  { month: "Mar", revenue: 295000, expenses: 88000 },
  { month: "Apr", revenue: 340000, expenses: 115000 },
  { month: "May", revenue: 360000, expenses: 98000 },
  { month: "Jun", revenue: 385000, expenses: 120000 },
  { month: "Jul", revenue: 420000, expenses: 110000 },
];

const residentGrowthData = [
  { month: "Jan", residents: 78 },
  { month: "Feb", residents: 85 },
  { month: "Mar", residents: 82 },
  { month: "Apr", residents: 90 },
  { month: "May", residents: 93 },
  { month: "Jun", residents: 98 },
  { month: "Jul", residents: 105 },
];

const pieData = [
  { name: "Occupied", value: 94, color: "#2563EB" },
  { name: "Vacant", value: 6, color: "#E2E8F0" },
];

const residents = [
  {
    name: "Ankit Joshi",
    room: "202A",
    joined: "15 Jan 2025",
    rent: "₹12,000",
    status: "Paid",
    avatar: "AJ",
  },
  {
    name: "Meera Pillai",
    room: "104B",
    joined: "3 Feb 2025",
    rent: "₹10,500",
    status: "Paid",
    avatar: "MP",
  },
  {
    name: "Suresh Babu",
    room: "301C",
    joined: "20 Mar 2025",
    rent: "₹11,000",
    status: "Due",
    avatar: "SB",
  },
  {
    name: "Kavya Nair",
    room: "205D",
    joined: "8 Apr 2025",
    rent: "₹13,500",
    status: "Paid",
    avatar: "KN",
  },
  {
    name: "Rohit Sinha",
    room: "110A",
    joined: "12 May 2025",
    rent: "₹9,500",
    status: "Late",
    avatar: "RS",
  },
];

const activities = [
  {
    text: "New resident Priya Sharma checked in",
    time: "2 hours ago",
    icon: Users,
    color: "text-blue-600 bg-blue-50",
  },
  {
    text: "Rent collected from Room 302A — ₹12,000",
    time: "4 hours ago",
    icon: CreditCard,
    color: "text-green-600 bg-green-50",
  },
  {
    text: "Complaint #47 resolved — WiFi issue",
    time: "6 hours ago",
    icon: CheckCircle,
    color: "text-teal-600 bg-teal-50",
  },
  {
    text: "Late payment alert: Room 110A",
    time: "1 day ago",
    icon: AlertCircle,
    color: "text-orange-600 bg-orange-50",
  },
  {
    text: 'New PG property "Sunrise Home" added',
    time: "2 days ago",
    icon: Building2,
    color: "text-violet-600 bg-violet-50",
  },
];

const widgets = [
  {
    label: "Total PGs",
    value: "4",
    sub: "+1 this quarter",
    icon: Building2,
    trend: "up",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    label: "Occupied Beds",
    value: "141",
    sub: "94% occupancy",
    icon: BedDouble,
    trend: "up",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100",
  },
  {
    label: "Vacant Beds",
    value: "9",
    sub: "6% available",
    icon: BedDouble,
    trend: "neutral",
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-100",
  },
  {
    label: "Monthly Revenue",
    value: "₹4.2L",
    sub: "+12% vs last month",
    icon: TrendingUp,
    trend: "up",
    color: "text-green-600",
    bg: "bg-green-50 border-green-100",
  },
  {
    label: "Pending Rent",
    value: "₹38,500",
    sub: "8 residents due",
    icon: Clock,
    trend: "down",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100",
  },
  {
    label: "Monthly Expenses",
    value: "₹1.1L",
    sub: "-8% vs last month",
    icon: TrendingDown,
    trend: "good",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100",
  },
];

export default function Dashboard({ navigate }: Props) {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={navigate} activePage="dashboard">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Good morning, Rajesh 👋
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Wednesday, 23 July 2025 · Here's what's happening across your
              properties.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <Calendar className="w-4 h-4" />
            Monthly Report
          </button>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {widgets.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.label}
                className={`${darkMode ? "bg-slate-800 border-slate-700" : `bg-white border ${w.bg}`} rounded-2xl p-4 border card-hover`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl ${darkMode ? "bg-slate-700" : w.bg.split(" ")[0]} flex items-center justify-center`}
                  >
                    <Icon
                      className={`w-4 h-4 ${darkMode ? "text-slate-300" : w.color}`}
                    />
                  </div>
                  <MoreHorizontal
                    className={`w-4 h-4 ${darkMode ? "text-slate-600" : "text-slate-300"}`}
                  />
                </div>
                <p
                  className={`text-2xl font-black mb-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  {w.value}
                </p>
                <p
                  className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {w.label}
                </p>
                <p
                  className={`text-xs mt-1 ${w.trend === "up" || w.trend === "good" ? "text-green-500" : w.trend === "down" ? "text-orange-500" : "text-slate-400"}`}
                >
                  {w.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue chart */}
          <div
            className={`lg:col-span-2 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Revenue vs Expenses
                </h3>
                <p
                  className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Last 7 months
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-blue-600 rounded-full inline-block" />{" "}
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-violet-300 rounded-full inline-block" />{" "}
                  Expenses
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={revenueData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#334155" : "#F1F5F9"}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: darkMode ? "#94A3B8" : "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: darkMode ? "#94A3B8" : "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: darkMode ? "#1e293b" : "white",
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v) => [`₹${(Number(v ?? 0) / 1000).toFixed(1)}K`]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#expGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Occupancy donut */}
          <div
            className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border p-6`}
          >
            <h3
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Occupancy Rate
            </h3>
            <p
              className={`text-xs mb-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Current period
            </p>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p
                    className={`text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    94%
                  </p>
                  <p
                    className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Occupied
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />{" "}
                  Occupied
                </span>
                <span
                  className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                >
                  141 beds
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />{" "}
                  Vacant
                </span>
                <span
                  className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                >
                  9 beds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Resident growth */}
          <div
            className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Resident Growth
              </h3>
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                +34%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart
                data={residentGrowthData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#334155" : "#F1F5F9"}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "none",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="residents"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  dot={{ fill: "#14B8A6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Late payments */}
          <div
            className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Payment Status
              </h3>
              <button
                onClick={() => navigate("billing")}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Paid on time",
                  count: 98,
                  pct: 78,
                  color: "bg-green-500",
                },
                {
                  label: "Late (1-7 days)",
                  count: 17,
                  pct: 14,
                  color: "bg-orange-400",
                },
                {
                  label: "Late (7+ days)",
                  count: 8,
                  pct: 6,
                  color: "bg-red-500",
                },
                { label: "Pending", count: 2, pct: 2, color: "bg-slate-300" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {item.count}
                    </span>
                  </div>
                  <div
                    className={`h-1.5 w-full rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    <div
                      className={`h-1.5 rounded-full ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div
            className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Recent Activity
              </h3>
              <Activity
                className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
              />
            </div>
            <div className="space-y-3">
              {activities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg ${act.color} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {act.text}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {act.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Residents table */}
        <div
          className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} rounded-2xl border overflow-hidden`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3
              className={`font-bold ${darkMode ? "text-white border-slate-700" : "text-slate-900"}`}
            >
              Recent Residents
            </h3>
            <button
              onClick={() => navigate("residents")}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
            >
              View all residents
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-500 bg-slate-900/50" : "text-slate-400 bg-slate-50"}`}
                >
                  <th className="text-left px-6 py-3">Resident</th>
                  <th className="text-left px-6 py-3">Room</th>
                  <th className="text-left px-6 py-3">Joined</th>
                  <th className="text-left px-6 py-3">Rent</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {residents.map((r) => (
                  <tr
                    key={r.name}
                    className={`transition-colors ${darkMode ? "hover:bg-slate-700/50 divide-slate-700" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.avatar}
                        </div>
                        <span
                          className={`text-sm font-medium ${darkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {r.room}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {r.joined}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-sm font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {r.rent}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : r.status === "Due"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
