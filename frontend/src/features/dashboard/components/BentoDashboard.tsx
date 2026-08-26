import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building,
  DollarSign,
  AlertCircle,
  Utensils,
  Wrench,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../../theme";
import { api } from "../../../services/api";

const REVENUE_DATA = [
  { month: "Jan", revenue: 1850000 },
  { month: "Feb", revenue: 1920000 },
  { month: "Mar", revenue: 2100000 },
  { month: "Apr", revenue: 2250000 },
  { month: "May", revenue: 2400000 },
  { month: "Jun", revenue: 2580000 },
  { month: "Jul", revenue: 2750000 },
];

export const BentoDashboard: React.FC = () => {
  const { darkMode } = useTheme();
  const [metrics, setMetrics] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api.getOwnerSummary();
        if (data) setMetrics(data);
      } catch (e) {
        console.warn("Metrics load fallback:", e);
      }
    }
    loadMetrics();

    const handleDataChanged = () => loadMetrics();
    window.addEventListener("roombae-data-changed", handleDataChanged);
    return () => window.removeEventListener("roombae-data-changed", handleDataChanged);
  }, []);

  const occupancyRate = metrics?.occupancyRatePercent !== undefined
    ? `${metrics.occupancyRatePercent}%`
    : "0%";
  const mrrText = (metrics?.totalRevenue || metrics?.mrr)
    ? `₹${(metrics.totalRevenue || metrics.mrr).toLocaleString("en-IN")}`
    : "₹0";

  const cardBg = darkMode
    ? "bg-neutral-900/90 border-white/10 text-white"
    : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)] shadow-md";
  const heroCardBg = darkMode
    ? "bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border-amber-500/20 text-white"
    : "bg-gradient-to-br from-[#f7f7f7] via-[#ffffff] to-[#ffffff] border-[var(--brand-primary)]/40 text-[var(--text-main)] shadow-md";
  const textPrimary = darkMode ? "text-white" : "text-[var(--text-main)]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[var(--text-muted)]";
  const accentText = darkMode ? "text-amber-400" : "text-[var(--brand-primary)]";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden group shadow-2xl ${heroCardBg}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}
            >
              Total Occupancy
            </span>
            <h3 className={`text-4xl font-extrabold mt-1 ${textPrimary}`}>
              {occupancyRate}
            </h3>
            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-2 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.8% from last month
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-6 space-y-1.5">
          <div
            className={`flex justify-between text-xs font-medium ${textMuted}`}
          >
            <span>{metrics?.occupiedBeds ?? 0} Occupied</span>
            <span>
              {(metrics?.totalBeds ?? 0) - (metrics?.occupiedBeds ?? 0)} Vacant
              Beds
            </span>
          </div>
          <div
            className={`h-3 w-full rounded-full overflow-hidden p-0.5 ${darkMode ? "bg-white/10" : "bg-[var(--bg-surface)]"}`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics?.occupancyRatePercent ?? 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardBg}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}
            >
              Monthly Revenue (MRR)
            </span>
            <h3 className={`text-3xl font-extrabold mt-1 ${textPrimary}`}>
              {mrrText}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#171717" : "#ffffff",
                  borderColor: darkMode ? "#333" : "#dddddd",
                  borderRadius: "12px",
                  color: darkMode ? "#FFF" : "#222222",
                }}
                formatter={(val: any) => [
                  `₹${(val / 100000).toFixed(2)} Lakhs`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4 }}
        className={`col-span-1 p-6 rounded-3xl border border-rose-500/20 backdrop-blur-xl flex flex-col justify-between ${cardBg}`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Pending Rent
          </span>
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div className="mt-4">
          <h4 className={`text-2xl font-bold ${textPrimary}`}>
            ₹{(metrics?.pendingDuesAmount ?? 0).toLocaleString("en-IN")}
          </h4>
          <p className="text-xs text-rose-400 mt-1 font-medium">
            Pending outstanding dues
          </p>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4 }}
        className={`col-span-1 p-6 rounded-3xl border border-amber-500/20 backdrop-blur-xl flex flex-col justify-between ${cardBg}`}
      >
        <div className="flex justify-between items-start">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}
          >
            Complaints
          </span>
          <AlertCircle className={`w-5 h-5 ${accentText}`} />
        </div>
        <div className="mt-4">
          <h4 className={`text-2xl font-bold ${textPrimary}`}>
            {metrics?.activeComplaints ?? 0} Open
          </h4>
          <p className="text-xs text-emerald-500 mt-1 font-medium">
            Active complaint tickets
          </p>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4 }}
        className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl flex items-center justify-between ${cardBg}`}
      >
        <div className="space-y-1">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}
          >
            Mess Food Rating
          </span>
          <h4
            className={`text-3xl font-extrabold flex items-center gap-2 ${textPrimary}`}
          >
            4.8 <span className="text-yellow-400 text-2xl">★</span>
          </h4>
          <p className={`text-xs ${textMuted}`}>
            Based on 1,180 weekly feedback ratings
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Utensils className="w-8 h-8" />
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4 }}
        className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl flex items-center justify-between ${cardBg}`}
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Active Residents
          </span>
          <h4 className={`text-3xl font-extrabold ${textPrimary}`}>
            {metrics?.occupiedBeds ?? 0}
          </h4>
          <p className="text-xs text-blue-400 font-medium">
            Across {metrics?.totalProperties ?? 0} Co-Living Properties
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Users className="w-8 h-8" />
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -4 }}
        className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl flex items-center justify-between ${cardBg}`}
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Maintenance &amp; Biometrics
          </span>
          <h4
            className={`text-xl font-bold flex items-center gap-2 ${textPrimary}`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> All Systems
            100% Operational
          </h4>
          <p className={`text-xs ${textMuted}`}>
            Biometric gates, CCTV feeds, and power backups active
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Wrench className="w-8 h-8" />
        </div>
      </motion.div>
    </div>
  );
};
