import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building, AlertCircle, Clock, LogOut, Phone
} from 'lucide-react';

export type KanbanBoardType = 'residents' | 'pgs' | 'complaints' | 'holds' | 'leaving';

interface KanbanBoardsProps {
  onSelectResident?: (residentId: string) => void;
}

// 1. Resident Status Board Data
const INITIAL_RESIDENTS = [
  { id: 'res-1', name: 'Rahul Sharma', room: '101-A', rent: '₹8,500', phone: '+91 98765 43210', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1534528741775?w=150', status: 'ACTIVE' },
  { id: 'res-2', name: 'Priya Patel', room: '102-B', rent: '₹9,000', phone: '+91 98765 43211', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'HOME' },
  { id: 'res-3', name: 'Vikram Singh', room: '201-A', rent: '₹8,500', phone: '+91 98765 43212', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'ON_LEAVE' },
  { id: 'res-4', name: 'Ananya Roy', room: '204-B', rent: '₹9,500', phone: '+91 98765 43213', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', status: 'HOLD' },
  { id: 'res-5', name: 'Siddharth Nair', room: '301-C', rent: '₹8,000', phone: '+91 98765 43214', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'LEAVING' },
  { id: 'res-6', name: 'Neha Gupta', room: '302-A', rent: '₹9,000', phone: '+91 98765 43215', due: '5th Aug', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', status: 'CHECKED_OUT' }
];

// 2. PG Status Board Data
const INITIAL_PGS = [
  { id: 'pg-1', name: 'RoomBae Indiranagar Luxe', location: 'Indiranagar, Bengaluru', capacity: '72 Beds', occupancy: '92%', status: 'Active' },
  { id: 'pg-2', name: 'RoomBae Cyber City Executive', location: 'Cyber City, Gurugram', capacity: '96 Beds', occupancy: '88%', status: 'Active' },
  { id: 'pg-3', name: 'RoomBae Hinjewadi Tech Residency', location: 'Hinjewadi, Pune', capacity: '64 Beds', occupancy: '75%', status: 'Maintenance' },
  { id: 'pg-4', name: 'RoomBae Gachibowli Heights', location: 'Gachibowli, Hyderabad', capacity: '80 Beds', occupancy: '0%', status: 'Upcoming' }
];

// 3. Complaint Board Data
const INITIAL_COMPLAINTS = [
  { id: 'comp-1', ticket: 'TICK-101', title: 'WiFi Latency on 3rd Floor', priority: 'HIGH', resident: 'Rahul Sharma', status: 'Open' },
  { id: 'comp-2', ticket: 'TICK-102', title: 'AC Cooling Remote Battery', priority: 'MEDIUM', resident: 'Priya Patel', status: 'Assigned' },
  { id: 'comp-3', ticket: 'TICK-103', title: 'Bathroom Tap Dripping', priority: 'URGENT', resident: 'Vikram Singh', status: 'In Progress' },
  { id: 'comp-4', ticket: 'TICK-104', title: 'Laundry Collection Delay', priority: 'LOW', resident: 'Neha Gupta', status: 'Resolved' }
];

// 4. Hold Applications Board Data
const INITIAL_HOLDS = [
  { id: 'hold-1', applicant: 'Aditya Verma', pg: 'Indiranagar Luxe', roomType: 'Single AC', advance: '₹5,000', status: 'Pending' },
  { id: 'hold-2', applicant: 'Sneha Kapoor', pg: 'Cyber City', roomType: 'Double Sharing', advance: '₹5,000', status: 'Waiting Documents' },
  { id: 'hold-3', applicant: 'Karan Malhotra', pg: 'Hinjewadi Tech', roomType: 'Triple Sharing', advance: '₹5,000', status: 'Approved' }
];

// 5. Leaving Residents Board Data
const INITIAL_LEAVING = [
  { id: 'leave-1', name: 'Siddharth Nair', room: '301-C', depositRefund: '₹15,000', noticeDate: '15th Jul', status: 'Notice Given' },
  { id: 'leave-2', name: 'Rohan Mehta', room: '202-A', depositRefund: '₹14,500', noticeDate: '10th Jul', status: 'Packing' },
  { id: 'leave-3', name: 'Kavita Krishnan', room: '105-B', depositRefund: '₹15,000', noticeDate: '1st Jul', status: 'Refund Pending' }
];

export const KanbanBoards: React.FC<KanbanBoardsProps> = ({ onSelectResident }) => {
  const [activeBoard, setActiveBoard] = useState<KanbanBoardType>('residents');
  const [residents, setResidents] = useState(INITIAL_RESIDENTS);
  const [pgs] = useState(INITIAL_PGS);
  const [complaints] = useState(INITIAL_COMPLAINTS);
  const [holds] = useState(INITIAL_HOLDS);
  const [leaving] = useState(INITIAL_LEAVING);

  const moveResidentStatus = (id: string, newStatus: string) => {
    setResidents(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="w-full space-y-6">
      {/* Board Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-white/10 w-fit">
        <button
          onClick={() => setActiveBoard('residents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === 'residents'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Board 1: Resident Status
        </button>

        <button
          onClick={() => setActiveBoard('pgs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === 'pgs'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          Board 2: PG Status
        </button>

        <button
          onClick={() => setActiveBoard('complaints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === 'complaints'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Board 3: Complaints
        </button>

        <button
          onClick={() => setActiveBoard('holds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === 'holds'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Board 4: Holds
        </button>

        <button
          onClick={() => setActiveBoard('leaving')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === 'leaving'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Board 5: Leaving
        </button>
      </div>

      {/* Board 1: Resident Status */}
      {activeBoard === 'residents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {[
            { label: '🟢 Active', code: 'ACTIVE', color: 'border-emerald-500/30 bg-emerald-500/5' },
            { label: '🏠 Home', code: 'HOME', color: 'border-blue-500/30 bg-blue-500/5' },
            { label: '🟡 Leave', code: 'ON_LEAVE', color: 'border-amber-500/30 bg-amber-500/5' },
            { label: '🟠 Hold', code: 'HOLD', color: 'border-orange-500/30 bg-orange-500/5' },
            { label: '🔴 Leaving Soon', code: 'LEAVING', color: 'border-rose-500/30 bg-rose-500/5' },
            { label: '⚫ Inactive', code: 'INACTIVE', color: 'border-neutral-500/30 bg-neutral-500/5' },
            { label: '⚪ Checked Out', code: 'CHECKED_OUT', color: 'border-purple-500/30 bg-purple-500/5' }
          ].map(col => {
            const items = residents.filter(r => r.status === col.code);
            return (
              <div key={col.code} className={`p-3 rounded-2xl border ${col.color} flex flex-col gap-3 min-w-[220px]`}>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-semibold text-neutral-300">{col.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      whileHover={{ y: -3, scale: 1.02 }}
                      className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 shadow-lg backdrop-blur-md space-y-3 cursor-pointer hover:border-amber-500/40 transition-all"
                      onClick={() => onSelectResident?.(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <img src={item.photo} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-amber-500/30" />
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">{item.name}</p>
                          <p className="text-xs text-amber-400 font-medium">Room {item.room}</p>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Rent: <strong className="text-white">{item.rent}</strong></span>
                          <span className="text-emerald-400 font-medium">Due: {item.due}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Phone className="w-3 h-3 text-amber-400" />
                          <span>{item.phone}</span>
                        </div>
                      </div>

                      {/* Quick Move Action */}
                      <div className="pt-2 border-t border-white/5 flex gap-1 justify-end">
                        {col.code !== 'HOME' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveResidentStatus(item.id, 'HOME'); }}
                            className="px-2 py-1 text-[10px] rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                          >
                            Set Home 🏠
                          </button>
                        )}
                        {col.code !== 'ACTIVE' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveResidentStatus(item.id, 'ACTIVE'); }}
                            className="px-2 py-1 text-[10px] rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Set Active 🟢
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board 2: PG Status */}
      {activeBoard === 'pgs' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Active', 'Maintenance', 'Upcoming', 'Archived'].map(colStatus => {
            const items = pgs.filter(p => p.status === colStatus);
            return (
              <div key={colStatus} className="p-4 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{colStatus} PGs ({items.length})</h4>
                <div className="space-y-3">
                  {items.map(pg => (
                    <motion.div key={pg.id} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                      <p className="text-sm font-semibold text-white">{pg.name}</p>
                      <p className="text-xs text-neutral-400">{pg.location}</p>
                      <div className="flex justify-between text-xs pt-2 border-t border-white/5 text-amber-300">
                        <span>Capacity: {pg.capacity}</span>
                        <span>Occupancy: {pg.occupancy}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board 3: Complaints */}
      {activeBoard === 'complaints' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Open', 'Assigned', 'In Progress', 'Resolved'].map(status => {
            const items = complaints.filter(c => c.status === status);
            return (
              <div key={status} className="p-4 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{status} ({items.length})</h4>
                <div className="space-y-3">
                  {items.map(c => (
                    <motion.div key={c.id} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-400">{c.ticket}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold">{c.priority}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{c.title}</p>
                      <p className="text-xs text-neutral-400">Resident: {c.resident}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board 4: Holds */}
      {activeBoard === 'holds' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Pending', 'Waiting Documents', 'Approved'].map(status => {
            const items = holds.filter(h => h.status === status);
            return (
              <div key={status} className="p-4 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{status} ({items.length})</h4>
                <div className="space-y-3">
                  {items.map(h => (
                    <motion.div key={h.id} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                      <p className="text-sm font-semibold text-white">{h.applicant}</p>
                      <p className="text-xs text-neutral-400">{h.pg} • {h.roomType}</p>
                      <p className="text-xs text-emerald-400 font-medium">Advance Paid: {h.advance}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board 5: Leaving */}
      {activeBoard === 'leaving' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Notice Given', 'Packing', 'Refund Pending'].map(status => {
            const items = leaving.filter(l => l.status === status);
            return (
              <div key={status} className="p-4 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3">
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">{status} ({items.length})</h4>
                <div className="space-y-3">
                  {items.map(l => (
                    <motion.div key={l.id} whileHover={{ y: -2 }} className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                      <p className="text-sm font-semibold text-white">{l.name}</p>
                      <p className="text-xs text-neutral-400">Room: {l.room} • Notice: {l.noticeDate}</p>
                      <p className="text-xs text-amber-400 font-medium">Refund Amount: {l.depositRefund}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
