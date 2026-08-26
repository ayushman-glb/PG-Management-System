import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, Home, AlertCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../theme';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: string, id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const [results] = useState<any>({

    residents: [
      { id: 'res-1', name: 'Rahul Sharma', room: '101-A', phone: '+91 98765 43210' },
      { id: 'res-2', name: 'Priya Patel', room: '102-B', phone: '+91 98765 43211' }
    ],
    rooms: [
      { id: 'rm-101', roomNumber: 'Room 101', type: 'Single AC', rent: '₹8,500' },
      { id: 'rm-102', roomNumber: 'Room 102', type: 'Double Non-AC', rent: '₹7,000' }
    ],
    beds: [
      { id: 'bed-101a', bedNumber: 'Bed 101-A', room: 'Room 101', status: 'OCCUPIED' },
      { id: 'bed-101b', bedNumber: 'Bed 101-B', room: 'Room 101', status: 'AVAILABLE' }
    ],
    complaints: [
      { id: 'c-1', ticketCode: 'CMP-2026-001', title: 'AC Cooling Issue', status: 'OPEN' }
    ],
    invoices: [
      { id: 'inv-1', invoiceNumber: 'INV-2026-08-01', amount: '₹8,500', status: 'PAID' }
    ]
  });
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle modal trigger
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const modalBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[var(--bg-primary)] border-[var(--border-main)] text-[var(--text-main)]";
  const cardBg = darkMode ? "bg-neutral-800/60 border-white/5 text-white" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)]";
  const inputBg = darkMode ? "bg-neutral-800 border-white/10 text-white placeholder-neutral-500" : "bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)] placeholder-[#6a6a6a]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[var(--text-muted)]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className={`w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl flex flex-col ${modalBg}`}
        >
          {/* Top Search Input */}
          <div className="relative p-4 border-b border-amber-500/20 flex items-center">
            <Search className="w-5 h-5 absolute left-6 text-amber-500" />
            <input
              type="text"
              autoFocus
              placeholder="Global Search residents, rooms, beds, complaints, invoices... (Ctrl + K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full pl-12 pr-10 py-3 rounded-2xl text-sm focus:outline-none focus:border-amber-500 ${inputBg}`}
            />
            <button onClick={onClose} className="absolute right-6 p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results Categories */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-xs" data-lenis-prevent>
            {/* Residents */}
            {results.residents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Residents ({results.residents.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {results.residents.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => { onSelectResult?.('resident', r.id); onClose(); }}
                      className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer hover:border-amber-500/40 transition-all ${cardBg}`}
                    >
                      <div>
                        <p className="font-bold text-sm">{r.name}</p>
                        <p className={`text-xs ${textMuted}`}>Room: {r.room} • {r.phone}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-500 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms & Beds */}
            {results.rooms.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> Rooms &amp; Beds ({results.rooms.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {results.rooms.map((rm: any) => (
                    <div
                      key={rm.id}
                      onClick={() => { onSelectResult?.('room', rm.id); onClose(); }}
                      className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer hover:border-amber-500/40 transition-all ${cardBg}`}
                    >
                      <div>
                        <p className="font-bold text-sm">{rm.roomNumber}</p>
                        <p className={`text-xs ${textMuted}`}>{rm.type} • {rm.rent}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-500 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complaints */}
            {results.complaints.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Complaints &amp; Tickets ({results.complaints.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {results.complaints.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => { onSelectResult?.('complaint', c.id); onClose(); }}
                      className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer hover:border-amber-500/40 transition-all ${cardBg}`}
                    >
                      <div>
                        <p className="font-bold text-sm">{c.ticketCode} - {c.title}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">{c.status}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-500 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
