import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Activity, Search, RefreshCw, User, Globe, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../theme';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/audit-logs').catch(() => null);
      const data = (res as any)?.data ?? res;
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const drawerBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)]";
  const cardBg = darkMode ? "bg-neutral-800/60 border-white/5 text-white" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)]";
  const textPrimary = darkMode ? "text-white" : "text-[var(--text-main)]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[var(--text-muted)]";
  const inputBg = darkMode ? "bg-neutral-800 border-white/10 text-white placeholder-neutral-500" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)] placeholder-[#6a6a6a]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`w-full max-w-full sm:max-w-md md:max-w-lg h-full border-l p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden ${drawerBg}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>System Audit Logs</h3>
                <p className={`text-xs ${textMuted}`}>Immutable security & activity trail</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${darkMode ? "bg-neutral-800 text-neutral-400 hover:text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                title="Refresh Logs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${darkMode ? "bg-neutral-800 text-neutral-400 hover:text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${textMuted}`} />
            <input
              type="text"
              placeholder="Search audit actions, users, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${inputBg}`}
            />
          </div>

          {/* Audit Trail List */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {log.action}
                  </span>
                  <span className={`text-xs flex items-center gap-1 font-mono ${textMuted}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className={`text-xs font-medium leading-relaxed ${textPrimary}`}>{log.details}</p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-500/10">
                  <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                    <User className="w-3 h-3" />
                    <span>{log.user?.name || 'System User'} ({log.user?.role || 'OWNER'})</span>
                  </div>
                  <div className={`flex items-center gap-2 ${textMuted}`}>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {log.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className={`h-64 flex flex-col items-center justify-center text-center space-y-2 ${textMuted}`}>
                <Activity className="w-8 h-8 opacity-40" />
                <p className="text-xs">No audit logs matching search filter</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

