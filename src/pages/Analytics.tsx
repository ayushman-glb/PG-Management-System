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
  { name: "Plumbing", value: 32, color: "#2563EB" },
  { name: "Electrical", value: 28, color: "#7C3AED" },
  { name: "Maintenance", value: 20, color: "#14B8A6" },
  { name: "Sanitation", value: 12, color: "#F59E0B" },
  { name: "Misc", value: 8, color: "#EF4444" },
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

  return (
    <DashboardLayout navigate={navigate} activePage="analytics">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Deep insights across all your properties
            </p>
          </div>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === p ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
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
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Avg Occupancy",
              value: "93.2%",
              change: "+5.1%",
              up: true,
              icon: Users,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Total Complaints",
              value: "89",
              change: "-12%",
              up: false,
              icon: AlertTriangle,
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              label: "Resident Growth",
              value: "+27",
              change: "+34%",
              up: true,
              icon: TrendingUp,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 p-5 card-hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${s.color}`} />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-green-600" : "text-red-600"}`}
                  >
                    {s.up ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Revenue vs Target</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly performance against targets
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-blue-600 rounded-full inline-block" />{" "}
                Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-slate-300 rounded-full inline-block" />{" "}
                Target
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={revenueData}
              margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
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
                fill="url(#revG)"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#CBD5E1"
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
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-1">
              Occupancy by Property
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Monthly occupancy rate per PG
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={occupancyData}
                margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
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
                    background: "white",
                    border: "none",
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  formatter={(v) => [`${Number(v ?? 0)}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="sunrise"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  name="Sunrise PG"
                />
                <Line
                  type="monotone"
                  dataKey="greenValley"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  dot={false}
                  name="Green Valley"
                />
                <Line
                  type="monotone"
                  dataKey="urbanNest"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  dot={false}
                  name="Urban Nest"
                />
                <Line
                  type="monotone"
                  dataKey="cityHeights"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  name="City Heights"
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-1">
              Payment Collections
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              On-time vs late vs defaulted
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={paymentData}
                margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
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
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
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
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-1">
              Complaints by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
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
                    stroke="white"
                  >
                    {categoryPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "none",
                      borderRadius: 8,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
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
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Occupancy heatmap */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-1">Occupancy Heatmap</h3>
            <p className="text-xs text-slate-500 mb-4">Sunrise PG — by room</p>
            <div className="space-y-2">
              {heatmapData.map((row) => (
                <div key={row.floor} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-14 flex-shrink-0">
                    {row.floor}
                  </span>
                  <div className="flex gap-1.5 flex-1">
                    {row.rooms.map((val, i) => (
                      <div
                        key={i}
                        className="flex-1 h-7 rounded-md"
                        style={{
                          background:
                            val === 100
                              ? "#2563EB"
                              : val >= 80
                                ? "#60A5FA"
                                : val >= 60
                                  ? "#BFDBFE"
                                  : "#EFF6FF",
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
              <span className="text-slate-400">Empty</span>
              <div className="flex gap-1 flex-1">
                {["#EFF6FF", "#BFDBFE", "#60A5FA", "#2563EB"].map((c) => (
                  <div
                    key={c}
                    className="flex-1 h-2 rounded-sm"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="text-slate-400">Full</span>
            </div>
          </div>

          {/* Vacancy prediction */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">Vacancy Prediction</h3>
              <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Predicted vacant beds next 5 months
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={vacancyPrediction}
                margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
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
                <Bar
                  dataKey="predicted"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                  name="Predicted Vacancies"
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Based on historical checkout patterns
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
