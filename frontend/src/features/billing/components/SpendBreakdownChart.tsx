import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { useTheme } from "../../../theme";
import { ShieldCheck, PieChart as PieIcon } from "lucide-react";

const SPEND_BAR_DATA = [
  { label: "$400.00", amount: 400 },
  { label: "$600.00", amount: 600 },
  { label: "$1,200.00", amount: 1200 },
  { label: "$1,800.00", amount: 1800 },
  { label: "$2,200.00", amount: 2200 },
];

const BREAKDOWN_CIRCLES = [
  { name: "Rent & Dues", percent: 45, color: "#8b5cf6" },
  { name: "Security Deposit", percent: 25, color: "#ec4899" },
  { name: "Food & Mess", percent: 20, color: "#3b82f6" },
  { name: "Utilities", percent: 10, color: "#10b981" },
];

export const SpendBreakdownChart: React.FC = () => {
  const { darkMode } = useTheme();

  const cardBg = darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]";
  const textPrimary = darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]";

  return (
    <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl space-y-6 ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>
            This Month
          </span>
          <h3 className={`text-xl font-extrabold tracking-tight ${textPrimary}`}>
            Spend Chart
          </h3>
        </div>
        <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
          <PieIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Bar Chart Matching Mockup */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SPEND_BAR_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: darkMode ? "#C6B9AE" : "#6E5A52" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? "#332D2B" : "#FFFDFB",
                borderColor: darkMode ? "#4A443F" : "#E6D7CA",
                borderRadius: "12px",
                fontSize: "12px",
                color: darkMode ? "#F7F3EE" : "#3B2A24",
              }}
            />
            <Bar dataKey="amount" fill="#7c3aed" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Percentage Circles Matching Mockup */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textMuted}`}>
          Breakdown
        </h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {BREAKDOWN_CIRCLES.map((c) => (
            <motion.div
              key={c.name}
              whileHover={{ y: -3 }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center ${
                darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow-md mb-1.5"
                style={{ backgroundColor: c.color }}
              >
                {c.percent}%
              </div>
              <span className={`text-[10px] font-semibold truncate max-w-full ${textMuted}`}>
                {c.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Account Info Bar Matching Mockup */}
      <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className={textMuted}>Account Number:</span>
          <span className={`font-bold ${textPrimary}`}>2255 4595 9874 4423</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className={textMuted}>Exp. Date:</span>
          <span className={`font-bold ${textPrimary}`}>12/24</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className={`text-[11px] font-bold ${textMuted}`}>Security Standard</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> PCI DSS Protected
          </span>
        </div>
      </div>
    </div>
  );
};
