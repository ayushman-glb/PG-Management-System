import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Bed, RefreshCcw, ArrowRight } from "lucide-react";

import { api } from "@services/api";
import { useRealtime } from "@hooks/useRealtime";
import { RoomTransferModal } from "@features/rooms/components/RoomTransferModal";
import { BedManagementModal } from "@features/beds/components/BedManagementModal";
import { useTheme } from "../../../theme";

export type KanbanBoardType = "residents" | "transfers" | "beds" | "pgs" | "complaints";

interface KanbanBoardsProps {
  onSelectResident?: (residentId: string) => void;
}

const RESIDENT_COLUMNS = [
  { id: "ACTIVE", label: "Active", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10", dot: "🟢" },
  { id: "HOME", label: "Home", color: "border-blue-500/30 text-blue-400 bg-blue-500/10", dot: "🏠" },
  { id: "ON_LEAVE", label: "Leave", color: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10", dot: "🟡" },
  { id: "HOLD", label: "Hold", color: "border-amber-500/30 text-amber-400 bg-amber-500/10", dot: "🟠" },
  { id: "LEAVING", label: "Leaving Soon", color: "border-rose-500/30 text-rose-400 bg-rose-500/10", dot: "🔴" },
  { id: "INACTIVE", label: "Inactive", color: "border-neutral-500/30 text-neutral-400 bg-neutral-500/10", dot: "⚫" },
  { id: "CHECKED_OUT", label: "Checked Out", color: "border-purple-500/30 text-purple-400 bg-purple-500/10", dot: "⚪" },
];

const TRANSFER_COLUMNS = [
  { id: "PENDING", label: "Pending", color: "border-yellow-500/30 text-yellow-400" },
  { id: "REVIEWING", label: "Reviewing", color: "border-blue-500/30 text-blue-400" },
  { id: "APPROVED", label: "Approved", color: "border-emerald-500/30 text-emerald-400" },
  { id: "REJECTED", label: "Rejected", color: "border-rose-500/30 text-rose-400" },
  { id: "SCHEDULED", label: "Scheduled", color: "border-purple-500/30 text-purple-400" },
  { id: "COMPLETED", label: "Completed", color: "border-emerald-600/30 text-emerald-500" },
];

const BED_COLUMNS = [
  { id: "AVAILABLE", label: "Available", color: "border-emerald-500/30 text-emerald-400" },
  { id: "OCCUPIED", label: "Occupied", color: "border-blue-500/30 text-blue-400" },
  { id: "RESERVED", label: "Reserved", color: "border-purple-500/30 text-purple-400" },
  { id: "HOLD", label: "Hold", color: "border-amber-500/30 text-amber-400" },
  { id: "MAINTENANCE", label: "Maintenance", color: "border-rose-500/30 text-rose-400" },
  { id: "BLOCKED", label: "Blocked", color: "border-neutral-500/30 text-neutral-400" },
];

const INITIAL_RESIDENTS = [
  { id: "res-1", name: "Rahul Sharma", room: "101-A", rent: "₹8,500", phone: "+91 98765 43210", due: "5th Aug", photo: "https://images.unsplash.com/photo-1534528741775?w=150", status: "ACTIVE" },
  { id: "res-2", name: "Priya Patel", room: "102-B", rent: "₹9,000", phone: "+91 98765 43211", due: "5th Aug", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", status: "HOME" },
  { id: "res-3", name: "Vikram Singh", room: "201-A", rent: "₹8,500", phone: "+91 98765 43212", due: "5th Aug", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", status: "ON_LEAVE" },
  { id: "res-4", name: "Ananya Roy", room: "204-B", rent: "₹9,500", phone: "+91 98765 43213", due: "5th Aug", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", status: "HOLD" },
  { id: "res-5", name: "Siddharth Nair", room: "301-C", rent: "₹8,000", phone: "+91 98765 43214", due: "5th Aug", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", status: "LEAVING" },
  { id: "res-6", name: "Neha Gupta", room: "302-A", rent: "₹9,000", phone: "+91 98765 43215", due: "5th Aug", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", status: "CHECKED_OUT" },
];

const INITIAL_TRANSFERS = [
  { id: "tr-1", residentName: "Rahul Sharma", currentRoom: "101-A", preferredRoom: "Single AC", reason: "Need quiet room for exams", budget: "₹10,500", priority: "HIGH", status: "PENDING" },
  { id: "tr-2", residentName: "Priya Patel", currentRoom: "102-B", preferredRoom: "2 Sharing", reason: "Friends shifting to Room 204", budget: "₹9,000", priority: "MEDIUM", status: "REVIEWING" },
  { id: "tr-3", residentName: "Vikram Singh", currentRoom: "201-A", preferredRoom: "Deluxe Suite", reason: "Upgrading workspace", budget: "₹14,000", priority: "LOW", status: "APPROVED" },
];

const INITIAL_BEDS = [
  { id: "bed-1", bedNumber: "101-A", roomNumber: "Room 101", status: "OCCUPIED", residentName: "Rahul Sharma" },
  { id: "bed-2", bedNumber: "101-B", roomNumber: "Room 101", status: "AVAILABLE", residentName: undefined },
  { id: "bed-3", bedNumber: "102-A", roomNumber: "Room 102", status: "RESERVED", residentName: "Rohan Mehta" },
  { id: "bed-4", bedNumber: "102-B", roomNumber: "Room 102", status: "HOLD", residentName: undefined },
  { id: "bed-5", bedNumber: "201-A", roomNumber: "Room 201", status: "MAINTENANCE", residentName: undefined },
  { id: "bed-6", bedNumber: "204-B", roomNumber: "Room 204", status: "BLOCKED", residentName: undefined },
];

export const KanbanBoards: React.FC<KanbanBoardsProps> = ({ onSelectResident }) => {
  const { darkMode } = useTheme();
  const [activeBoard, setActiveBoard] = useState<KanbanBoardType>("residents");
  const [residents, setResidents] = useState(INITIAL_RESIDENTS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [beds, setBeds] = useState(INITIAL_BEDS);

  const columnBg = darkMode ? "bg-neutral-900/60 border-white/10" : "bg-[#F8EEE5] border-[#E6D7CA]";
  const cardBg = darkMode ? "bg-neutral-800/80 border-white/10 text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] shadow-sm";
  const cardTextPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const cardTextMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";
  const tabBg = darkMode ? "bg-neutral-900/40 border-white/10" : "bg-[#F8EEE5] border-[#E6D7CA]";

  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        const resList = await api.getResidentDirectory();
        if (resList && Array.isArray(resList) && resList.length > 0) {
          const mappedRes = resList.map((r: any) => ({
            id: r.id,
            name: r.name || r.user?.name || "Resident",
            room: r.bed?.bedNumber || "Unassigned",
            rent: "₹8,500",
            phone: r.phone || r.user?.phone || "",
            due: "5th Aug",
            photo: r.profilePicture || "https://images.unsplash.com/photo-1534528741775?w=150",
            status: r.status || "ACTIVE"
          }));
          setResidents(mappedRes);
        }

        const transferList = await api.getRoomTransferRequests();
        if (transferList && Array.isArray(transferList) && transferList.length > 0) {
          setTransfers(transferList);
        }
      } catch (e) {
        console.warn("Kanban live load fallback:", e);
      }
    }
    loadData();
  }, []);

  useRealtime("resident:status_updated", (data: any) => {
    setResidents((prev) => prev.map((r) => (r.id === data.residentId ? { ...r, status: data.status } : r)));
  });

  useRealtime("bed:status_updated", (data: any) => {
    setBeds((prev) => prev.map((b) => (b.id === data.bedId ? { ...b, status: data.status } : b)));
  });

  useRealtime("transfer:requested", (data: any) => {
    setTransfers((prev) => [data, ...prev]);
  });

  const moveResidentStatus = async (id: string, newStatus: string) => {
    setResidents((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      await api.updateResidentStatus(id, newStatus, "Status changed via Kanban Command Board");
    } catch (e) {
      console.warn("API sync warning:", e);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: "resident" | "bed") => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropResident = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    try {
      const { id, type } = JSON.parse(dataStr);
      if (type === "resident") {
        moveResidentStatus(id, targetStatus);
      }
    } catch {}
  };

  const handleDropBed = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    try {
      const { id, type } = JSON.parse(dataStr);
      if (type === "bed") {
        setBeds((prev) => prev.map((b) => (b.id === id ? { ...b, status: targetStatus } : b)));
        api.updateBedStatus(id, targetStatus);
      }
    } catch {}
  };

  return (
    <div className="w-full space-y-6">
      <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl backdrop-blur-md border w-fit ${tabBg}`}>
        <button
          onClick={() => setActiveBoard("residents")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === "residents"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
              : `${cardTextMuted} hover:${cardTextPrimary}`
          }`}
        >
          <Users className="w-4 h-4" />
          Board 1: Resident Status
        </button>

        <button
          onClick={() => setActiveBoard("transfers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === "transfers"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
              : `${cardTextMuted} hover:${cardTextPrimary}`
          }`}
        >
          <RefreshCcw className="w-4 h-4" />
          Board 2: Room Transfers
        </button>

        <button
          onClick={() => setActiveBoard("beds")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeBoard === "beds"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
              : `${cardTextMuted} hover:${cardTextPrimary}`
          }`}
        >
          <Bed className="w-4 h-4" />
          Board 3: Bed Availability
        </button>
      </div>

      {activeBoard === "residents" && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {RESIDENT_COLUMNS.map((col) => {
            const items = residents.filter((r) => r.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropResident(e, col.id)}
                className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border p-3 min-h-[450px] transition-colors ${columnBg}`}
              >
                <div className="flex items-center justify-between px-2 py-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span>{col.dot}</span>
                    <h4 className={`font-semibold text-sm ${cardTextPrimary}`}>{col.label}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {items.map((res) => (
                    <motion.div
                      key={res.id}
                      layout
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, res.id, "resident")}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 group ${cardBg}`}
                      onClick={() => onSelectResident?.(res.id)}
                    >
                      <div className="flex items-center gap-3">
                        <img src={res.photo} alt={res.name} className="w-10 h-10 rounded-full object-cover border border-amber-500/20" />
                        <div>
                          <p className={`font-bold text-sm ${cardTextPrimary} group-hover:text-amber-400 transition-colors`}>{res.name}</p>
                          <p className="text-xs text-amber-400 font-medium">Room {res.room}</p>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between text-xs pt-1 border-t border-amber-500/10 ${cardTextMuted}`}>
                        <span>Rent: <strong className={cardTextPrimary}>{res.rent}</strong></span>
                        <span>Due: <strong className="text-emerald-500">{res.due}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {col.id !== "ACTIVE" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveResidentStatus(res.id, "ACTIVE"); }}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-semibold hover:bg-emerald-500/40 cursor-pointer"
                          >
                            Set Active 🟢
                          </button>
                        )}
                        {col.id !== "HOME" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveResidentStatus(res.id, "HOME"); }}
                            className="px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-[10px] font-semibold hover:bg-blue-500/40 cursor-pointer"
                          >
                            Set Home 🏠
                          </button>
                        )}
                        {col.id !== "ON_LEAVE" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveResidentStatus(res.id, "ON_LEAVE"); }}
                            className="px-2 py-1 rounded bg-amber-500/20 text-amber-500 text-[10px] font-semibold hover:bg-amber-500/40 cursor-pointer"
                          >
                            Set Leave 🟡
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <div className={`h-full flex items-center justify-center p-6 text-xs border border-dashed rounded-xl ${cardTextMuted} border-amber-500/20`}>
                      No residents in {col.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeBoard === "transfers" && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {TRANSFER_COLUMNS.map((col) => {
            const items = transfers.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border p-3 min-h-[450px] ${columnBg}`}>
                <div className="flex items-center justify-between px-2 py-1 mb-3">
                  <h4 className={`font-semibold text-sm ${cardTextPrimary}`}>{col.label}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {items.map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      onClick={() => { setSelectedTransfer(t); setIsTransferModalOpen(true); }}
                      className={`p-3.5 rounded-xl border cursor-pointer space-y-2 ${cardBg}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-sm ${cardTextPrimary}`}>{t.residentName || "Rahul Sharma"}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {t.priority}
                        </span>
                      </div>
                      <p className={`text-xs ${cardTextMuted}`}>Current: <span className={`font-medium ${cardTextPrimary}`}>{t.currentRoom}</span></p>
                      <p className="text-xs text-amber-400 font-medium">Requested: {t.preferredRoom || "Single AC"}</p>
                      <p className={`text-xs italic ${cardTextMuted}`}>&quot;{t.reason}&quot;</p>
                      <div className={`flex justify-between items-center text-[11px] pt-1 border-t border-amber-500/10 ${cardTextMuted}`}>
                        <span>Budget: {t.budget}</span>
                        <span className="text-amber-400 flex items-center gap-1 font-semibold">Action <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <div className={`h-full flex items-center justify-center p-6 text-xs border border-dashed rounded-xl ${cardTextMuted} border-amber-500/20`}>
                      No transfer requests
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeBoard === "beds" && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {BED_COLUMNS.map((col) => {
            const items = beds.filter((b) => b.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropBed(e, col.id)}
                className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border p-3 min-h-[450px] transition-colors ${columnBg}`}
              >
                <div className="flex items-center justify-between px-2 py-1 mb-3">
                  <h4 className={`font-semibold text-sm ${cardTextPrimary}`}>{col.label}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {items.map((bed) => (
                    <motion.div
                      key={bed.id}
                      layout
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, bed.id, "bed")}
                      onClick={() => { setSelectedBed(bed); setIsBedModalOpen(true); }}
                      className={`p-3.5 rounded-xl border cursor-grab active:cursor-grabbing space-y-2 ${cardBg}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-amber-400">Bed #{bed.bedNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {bed.roomNumber}
                        </span>
                      </div>
                      {bed.residentName ? (
                        <p className={`text-xs ${cardTextMuted}`}>Resident: <strong className={cardTextPrimary}>{bed.residentName}</strong></p>
                      ) : (
                        <p className="text-xs text-emerald-500 italic">Unoccupied / Available</p>
                      )}
                      <div className="flex justify-end pt-1">
                        <span className="text-xs text-amber-400 font-semibold hover:underline">Manage Bed &rarr;</span>
                      </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <div className={`h-full flex items-center justify-center p-6 text-xs border border-dashed rounded-xl ${cardTextMuted} border-amber-500/20`}>
                      No beds in {col.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RoomTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        mode="owner-action"
        requestData={selectedTransfer}
        onSuccess={() => {
          setIsTransferModalOpen(false);
        }}
      />

      <BedManagementModal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        bedData={selectedBed}
        onSuccess={() => {
          setIsBedModalOpen(false);
        }}
      />
    </div>
  );
};
