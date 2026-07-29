import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";
import { useTheme } from "../theme";

interface Props {
  navigate: (p: Page) => void;
}

const revenueData = [
  { month: "Jan", revenue: 285000, target: 300000 },
  { month: "Feb", revenue: 310000, target: 310000 },
  { month: "Mar", revenue: 295000, target: 310000 },
  { month: "Apr", revenue: 340000, target: 330000 },
  { month: "May", revenue: 360000, target: 350000 },
  { month: "Jun", revenue: 385000, target: 370000 },
  { month: "Jul", revenue: 420000, target: 390000 },
];

const occupancyData = [
  {
    month: "Jan",
    sunrise: 82,
    greenValley: 78,
    urbanNest: 88,
    cityHeights: 76,
  },
  {
    month: "Feb",
    sunrise: 88,
    greenValley: 84,
    urbanNest: 90,
    cityHeights: 80,
  },
  {
    month: "Mar",
    sunrise: 85,
    greenValley: 80,
    urbanNest: 87,
    cityHeights: 78,
  },
  {
    month: "Apr",
    sunrise: 91,
    greenValley: 88,
    urbanNest: 93,
    cityHeights: 84,
  },
  {
    month: "May",
    sunrise: 89,
    greenValley: 86,
    urbanNest: 92,
    cityHeights: 82,
  },
  {
    month: "Jun",
    sunrise: 94,
    greenValley: 91,
    urbanNest: 96,
    cityHeights: 88,
  },
  {
    month: "Jul",
    sunrise: 96,
    greenValley: 93,
    urbanNest: 98,
    cityHeights: 92,
  },
];

const paymentData = [
  { month: "Jan", onTime: 70, late: 8, defaulted: 2 },
  { month: "Feb", onTime: 75, late: 7, defaulted: 1 },
  { month: "Mar", onTime: 72, late: 9, defaulted: 2 },
  { month: "Apr", onTime: 80, late: 6, defaulted: 1 },
  { month: "May", onTime: 85, late: 5, defaulted: 1 },
  { month: "Jun", onTime: 88, late: 4, defaulted: 0 },
  { month: "Jul", onTime: 92, late: 5, defaulted: 1 },
];

const categoryPie = [
  { name: "Plumbing", value: 32, color: "#D9A87C" },
  { name: "Electrical", value: 28, color: "#C58B63" },
  { name: "Maintenance", value: 20, color: "#E7C4A0" },
  { name: "Sanitation", value: 12, color: "#D9A441" },
  { name: "Misc", value: 8, color: "#D96B5D" },
];

const vacancyPrediction = [
  { month: "Aug", actual: null, predicted: 8 },
  { month: "Sep", actual: null, predicted: 6 },
  { month: "Oct", actual: null, predicted: 5 },
  { month: "Nov", actual: null, predicted: 7 },
  { month: "Dec", actual: null, predicted: 10 },
];

const heatmapData = [
  { floor: "Floor 1", rooms: [95, 100, 100, 80, 100, 90, 100, 100] },
  { floor: "Floor 2", rooms: [100, 90, 100, 100, 75, 100, 100, 85] },
  { floor: "Floor 3", rooms: [100, 100, 80, 100, 100, 60, 100, 100] },
  { floor: "Floor 4", rooms: [90, 100, 100, 100, 100, 100, 75, 100] },
];

export default function Analytics({ navigate }: Props) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={navigate} activePage="analytics">
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Analytics
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Deep insights across all your properties
            </p>
          </div>
          <div
            className={`flex gap-1.5 p-1 rounded-xl flex-shrink-0 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}
          >
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  period === p
                    ? darkMode
                      ? "bg-slate-700 shadow-sm text-white"
                      : "bg-white shadow-sm text-slate-900"
                    : darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: "₹22.5L",
              change: "+18%",
              up: true,
              icon: CreditCard,
              color: "text-[#C58B63] dark:text-[#C89A4B]",
              bg: "bg-[#D9A87C]/10 border-[#D9A87C]/20",
            },
            {
              label: "Avg Occupancy",
              value: "93.2%",
              change: "+5.1%",
              up: true,
              icon: Users,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Total Complaints",
              value: "89",
              change: "-12%",
              up: false,
              icon: AlertTriangle,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
            {
              label: "Resident Growth",
              value: "+27",
              change: "+34%",
              up: true,
              icon: TrendingUp,
              color: "text-[#D9A87C] dark:text-[#C89A4B]",
              bg: "bg-[#D9A87C]/10 border-[#D9A87C]/20",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bento-card bento-card-interactive p-5 ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-bold ${s.up ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {s.up ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {s.change}
                  </span>
                </div>
                <p
                  className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
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

        {/* Revenue chart */}
        <div
          className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Revenue vs Target
              </h3>
              <p
                className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Monthly performance against targets
              </p>
            </div>
            <div
              className={`flex items-center gap-4 text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-[#D9A87C] rounded-full inline-block" />{" "}
                Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-1.5 rounded-full inline-block ${darkMode ? "bg-slate-500" : "bg-slate-300"}`}
                />{" "}
                Target
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={revenueData}
              margin={{ left: -10, right: 8, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={darkMode ? "#C89A4B" : "#D9A87C"} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={darkMode ? "#C89A4B" : "#D9A87C"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#4A433F" : "#E6D7CA"}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: darkMode ? "#C6B9AE" : "#6E5A52" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: darkMode ? "#C6B9AE" : "#6E5A52" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: darkMode ? "#332D2B" : "#FFFDFB",
                  border: `1px solid ${darkMode ? "#4A433F" : "#E6D7CA"}`,
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  color: darkMode ? "#F7F3EE" : "#3B2A24",
                }}
                formatter={(v) => [`₹${(Number(v ?? 0) / 1000).toFixed(1)}K`]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={darkMode ? "#C89A4B" : "#D9A87C"}
                strokeWidth={2.5}
                fill="url(#revG)"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke={darkMode ? "#475569" : "#CBD5E1"}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                name="Target"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Occupancy by property */}
          <div
            className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <h3
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Occupancy by Property
            </h3>
            <p
              className={`text-xs mb-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Monthly occupancy rate per PG
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={occupancyData}
                margin={{ left: -10, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#1E293B" : "#F1F5F9"}
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
                  domain={[70, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: darkMode ? "#1E293B" : "white",
                    border: "none",
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    color: darkMode ? "#F1F5F9" : "#0F172A",
                  }}
                  formatter={(v) => [`${Number(v ?? 0)}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="sunrise"
                  stroke="#D9A87C"
                  strokeWidth={2}
                  dot={false}
                  name="Sunrise PG"
                />
                <Line
                  type="monotone"
                  dataKey="greenValley"
                  stroke="#C58B63"
                  strokeWidth={2}
                  dot={false}
                  name="Green Valley"
                />
                <Line
                  type="monotone"
                  dataKey="urbanNest"
                  stroke="#E7C4A0"
                  strokeWidth={2}
                  dot={false}
                  name="Urban Nest"
                />
                <Line
                  type="monotone"
                  dataKey="cityHeights"
                  stroke="#D9A441"
                  strokeWidth={2}
                  dot={false}
                  name="City Heights"
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment breakdown */}
          <div
            className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <h3
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Payment Collections
            </h3>
            <p
              className={`text-xs mb-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              On-time vs late vs defaulted
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={paymentData}
                margin={{ left: -10, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#1E293B" : "#F1F5F9"}
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
                    background: darkMode ? "#1E293B" : "white",
                    border: "none",
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    color: darkMode ? "#F1F5F9" : "#0F172A",
                  }}
                />
                <Bar
                  dataKey="onTime"
                  fill="#22C55E"
                  radius={[3, 3, 0, 0]}
                  name="On Time"
                  stackId="a"
                />
                <Bar
                  dataKey="late"
                  fill="#F59E0B"
                  radius={[0, 0, 0, 0]}
                  name="Late"
                  stackId="a"
                />
                <Bar
                  dataKey="defaulted"
                  fill="#EF4444"
                  radius={[3, 3, 0, 0]}
                  name="Defaulted"
                  stackId="a"
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Complaint pie */}
          <div
            className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <h3
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Complaints by Category
            </h3>
            <p
              className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Distribution this year
            </p>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={categoryPie}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={darkMode ? "#1E293B" : "white"}
                  >
                    {categoryPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: darkMode ? "#1E293B" : "white",
                      border: "none",
                      borderRadius: 8,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                      color: darkMode ? "#F1F5F9" : "#0F172A",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {categoryPie.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    {item.name}
                  </span>
                  <span
                    className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                  >
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Occupancy heatmap */}
          <div
            className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <h3
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Occupancy Heatmap
            </h3>
            <p
              className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Sunrise PG — by room
            </p>
            <div className="space-y-2">
              {heatmapData.map((row) => (
                <div key={row.floor} className="flex items-center gap-2">
                  <span
                    className={`text-xs w-14 flex-shrink-0 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {row.floor}
                  </span>
                  <div className="flex gap-1.5 flex-1">
                    {row.rooms.map((val, i) => (
                      <div
                        key={i}
                        className="flex-1 h-7 rounded-md transition-all"
                        style={{
                          background:
                            val === 100
                              ? darkMode ? "#C89A4B" : "#D9A87C"
                              : val >= 80
                                ? darkMode ? "#D8B36A" : "#C58B63"
                                : val >= 60
                                  ? darkMode ? "#E8C98A" : "#E7C4A0"
                                  : darkMode
                                    ? "#332D2B"
                                    : "#F8EEE5",
                          opacity: val === 0 ? 0.3 : 1,
                        }}
                        title={`${val}%`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs">
              <span
                className={darkMode ? "text-slate-500" : "text-slate-400"}
              >
                Empty
              </span>
              <div className="flex gap-1 flex-1">
                {["#F8EEE5", "#E7C4A0", "#C58B63", "#D9A87C"].map((c) => (
                  <div
                    key={c}
                    className="flex-1 h-2 rounded-sm"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span
                className={darkMode ? "text-slate-500" : "text-slate-400"}
              >
                Full
              </span>
            </div>
          </div>

          {/* Vacancy prediction */}
          <div
            className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Vacancy Prediction
              </h3>
              <span className="text-xs bg-[#F8EEE5] text-[#C58B63] font-bold px-2 py-0.5 rounded-full">
                AI
              </span>
            </div>
            <p
              className={`text-xs mb-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Predicted vacant beds next 5 months
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={vacancyPrediction}
                margin={{ left: -10, right: 8, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#4A433F" : "#E6D7CA"}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: darkMode ? "#C6B9AE" : "#6E5A52" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: darkMode ? "#C6B9AE" : "#6E5A52" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: darkMode ? "#332D2B" : "#FFFDFB",
                    border: `1px solid ${darkMode ? "#4A433F" : "#E6D7CA"}`,
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    color: darkMode ? "#F7F3EE" : "#3B2A24",
                  }}
                />
                <Bar
                  dataKey="predicted"
                  fill={darkMode ? "#C89A4B" : "#D9A87C"}
                  radius={[4, 4, 0, 0]}
                  name="Predicted Vacancies"
                />
              </BarChart>
            </ResponsiveContainer>
            <p
              className={`text-xs mt-3 text-center ${darkMode ? "text-slate-500" : "text-slate-400"}`}
            >
              Based on historical checkout patterns
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
