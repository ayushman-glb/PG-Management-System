import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building, DollarSign, AlertCircle, Utensils, Wrench,
  ArrowUpRight, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, Tooltip, ResponsiveContainer
} from 'recharts';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 1850000 },
  { month: 'Feb', revenue: 1920000 },
  { month: 'Mar', revenue: 2100000 },
  { month: 'Apr', revenue: 2250000 },
  { month: 'May', revenue: 2400000 },
  { month: 'Jun', revenue: 2580000 },
  { month: 'Jul', revenue: 2750000 }
];

export const BentoDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {/* 1. Occupancy Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/20 backdrop-blur-xl relative overflow-hidden group shadow-2xl"
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Total Occupancy</span>
            <h3 className="text-4xl font-extrabold text-white mt-1">94.2%</h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.8% from last month
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-400 font-medium">
            <span>2,374 Occupied</span>
            <span>146 Vacant Beds</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '94.2%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Monthly Revenue / MRR */}
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl space-y-4"
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Monthly Revenue (MRR)</span>
            <h3 className="text-3xl font-extrabold text-white mt-1">₹27,50,000</h3>
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
                contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '12px' }}
                formatter={(val: any) => [`₹${(val / 100000).toFixed(2)} Lakhs`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 3. Pending Rent */}
      <motion.div
        whileHover={{ y: -4 }}
        className="col-span-1 p-6 rounded-3xl bg-neutral-900/90 border border-rose-500/20 backdrop-blur-xl flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Pending Rent</span>
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div className="mt-4">
          <h4 className="text-2xl font-bold text-white">₹1,85,000</h4>
          <p className="text-xs text-rose-400/80 mt-1">18 Residents Overdue</p>
        </div>
      </motion.div>

      {/* 4. Active Complaints */}
      <motion.div
        whileHover={{ y: -4 }}
        className="col-span-1 p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/20 backdrop-blur-xl flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Complaints</span>
          <AlertCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="mt-4">
          <h4 className="text-2xl font-bold text-white">12 Open</h4>
          <p className="text-xs text-emerald-400 mt-1">Avg resolution: 4.2 hrs</p>
        </div>
      </motion.div>

      {/* 5. Food Rating */}
      <motion.div
        whileHover={{ y: -4 }}
        className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Mess Food Rating</span>
          <h4 className="text-3xl font-extrabold text-white flex items-center gap-2">
            4.8 <span className="text-yellow-400 text-2xl">★</span>
          </h4>
          <p className="text-xs text-neutral-400">Based on 1,180 weekly feedback ratings</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Utensils className="w-8 h-8" />
        </div>
      </motion.div>

      {/* 6. Total Residents Count */}
      <motion.div
        whileHover={{ y: -4 }}
        className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Active Residents</span>
          <h4 className="text-3xl font-extrabold text-white">1,248</h4>
          <p className="text-xs text-blue-400/80">Across 35 Co-Living Properties</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Users className="w-8 h-8" />
        </div>
      </motion.div>

      {/* 7. Maintenance Status */}
      <motion.div
        whileHover={{ y: -4 }}
        className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Maintenance & Biometrics</span>
          <h4 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> All Systems 100% Operational
          </h4>
          <p className="text-xs text-neutral-400">Biometric gates, CCTV feeds, and power backups active</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Wrench className="w-8 h-8" />
        </div>
      </motion.div>
    </div>
  );
};
