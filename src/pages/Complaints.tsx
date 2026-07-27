import { useState } from "react";
import {
  Plus,
  MessageSquare,
  X,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";

interface Props {
  navigate: (p: Page) => void;
}

interface Complaint {
  id: string;
  title: string;
  resident: string;
  room: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  date: string;
  avatar: string;
  desc: string;
}

const initialComplaints: Record<string, Complaint[]> = {
  pending: [
    {
      id: "C-047",
      title: "Water heater not working",
      resident: "Suresh Babu",
      room: "301C",
      priority: "High",
      category: "Plumbing",
      date: "22 Jul 2025",
      avatar: "SB",
      desc: "Water heater has been malfunctioning for 3 days. No hot water.",
    },
    {
      id: "C-048",
      title: "WiFi drops frequently",
      resident: "Kavya Nair",
      room: "205D",
      priority: "Medium",
      category: "Electrical",
      date: "23 Jul 2025",
      avatar: "KN",
      desc: "Internet connectivity keeps dropping every few hours.",
    },
    {
      id: "C-049",
      title: "Window latch broken",
      resident: "Rohit Sinha",
      room: "110A",
      priority: "Low",
      category: "Maintenance",
      date: "23 Jul 2025",
      avatar: "RS",
      desc: "Window latch is broken and cannot be secured from inside.",
    },
    {
      id: "C-050",
      title: "Common area AC not working",
      resident: "Ankit Joshi",
      room: "202A",
      priority: "High",
      category: "Electrical",
      date: "23 Jul 2025",
      avatar: "AJ",
      desc: "The AC in the common lounge area stopped working.",
    },
  ],
  inProgress: [
    {
      id: "C-044",
      title: "Leaking tap in bathroom",
      resident: "Meera Pillai",
      room: "104B",
      priority: "Medium",
      category: "Plumbing",
      date: "18 Jul 2025",
      avatar: "MP",
      desc: "Bathroom tap has been leaking for a week.",
    },
    {
      id: "C-045",
      title: "Noisy neighbors complaint",
      resident: "Divya Reddy",
      room: "308B",
      priority: "Low",
      category: "Miscellaneous",
      date: "19 Jul 2025",
      avatar: "DR",
      desc: "Residents on 3rd floor making loud noise late at night.",
    },
  ],
  resolved: [
    {
      id: "C-041",
      title: "Broken door lock",
      resident: "Ankit Joshi",
      room: "202A",
      priority: "High",
      category: "Maintenance",
      date: "12 Jul 2025",
      avatar: "AJ",
      desc: "Room door lock was broken and posed a security risk.",
    },
    {
      id: "C-042",
      title: "Cockroach infestation",
      resident: "Priya Sharma",
      room: "106C",
      priority: "High",
      category: "Sanitation",
      date: "14 Jul 2025",
      avatar: "PS",
      desc: "Cockroaches spotted in the kitchen area.",
    },
    {
      id: "C-043",
      title: "Power socket not working",
      resident: "Kiran Rao",
      room: "412A",
      priority: "Medium",
      category: "Electrical",
      date: "16 Jul 2025",
      avatar: "KR",
      desc: "One of the power sockets in the room is dead.",
    },
  ],
};

const priorityConfig = {
  High: {
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  Medium: {
    color: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    icon: Zap,
  },
  Low: {
    color: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    icon: Clock,
  },
};

const columns = [
  {
    id: "pending",
    label: "Pending",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    headerBg: "bg-red-500",
  },
  {
    id: "inProgress",
    label: "In Progress",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    headerBg: "bg-orange-500",
  },
  {
    id: "resolved",
    label: "Resolved",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
    headerBg: "bg-green-500",
  },
];

export default function Complaints({ navigate }: Props) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [dragging, setDragging] = useState<{
    complaint: Complaint;
    from: string;
  } | null>(null);

  const handleDrop = (targetCol: string) => {
    if (!dragging || dragging.from === targetCol) return;
    const { complaint, from } = dragging;
    setComplaints((prev) => {
      const newState = { ...prev };
      newState[from] = newState[from].filter((c) => c.id !== complaint.id);
      newState[targetCol] = [complaint, ...newState[targetCol]];
      return newState;
    });
    setDragging(null);
  };

  const total = Object.values(complaints).flat().length;
  const resolvedCount = complaints.resolved.length;

  return (
    <DashboardLayout navigate={navigate} activePage="complaints">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Complaint Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track and resolve resident complaints — {resolvedCount}/{total}{" "}
              resolved
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            New Complaint
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`${col.bg} border ${col.border} rounded-2xl p-5 text-center`}
            >
              <p className={`text-3xl font-black ${col.color}`}>
                {complaints[col.id].length}
              </p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                {col.label}
              </p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-slate-50 rounded-2xl overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div
                className={`flex items-center justify-between px-4 py-3 ${col.bg} border-b ${col.border}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                  <span className={`font-bold text-sm ${col.color}`}>
                    {col.label}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${col.color} bg-white/60 px-2 py-0.5 rounded-full`}
                >
                  {complaints[col.id].length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 min-h-64">
                {complaints[col.id].map((complaint) => {
                  const pConf = priorityConfig[complaint.priority];
                  const PIcon = pConf.icon;
                  return (
                    <div
                      key={complaint.id}
                      draggable
                      onDragStart={() =>
                        setDragging({ complaint, from: col.id })
                      }
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setSelected(complaint)}
                      className="bg-white rounded-xl border border-slate-100 p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all select-none"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-mono text-slate-400">
                              {complaint.id}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                              {complaint.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                            {complaint.title}
                          </h4>
                        </div>
                        <span
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${pConf.color}`}
                        >
                          <PIcon className="w-3 h-3" />
                          {complaint.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {complaint.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {complaint.resident}
                            </p>
                            <p className="text-xs text-slate-400">
                              Room {complaint.room}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          {complaint.date}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {complaints[col.id].length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-slate-300 mb-1" />
                    <p className="text-xs text-slate-400">No complaints</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complaint detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selected.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selected.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                {selected.desc}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Resident", value: selected.resident },
                  { label: "Room", value: selected.room },
                  { label: "Category", value: selected.category },
                  { label: "Date", value: selected.date },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">
                      {item.label}
                    </p>
                    <p className="font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setComplaints((prev) => {
                      const newState = { ...prev };
                      for (const key of Object.keys(newState)) {
                        const idx = newState[key].findIndex(
                          (c) => c.id === selected.id,
                        );
                        if (idx >= 0) {
                          newState[key] = newState[key].filter(
                            (c) => c.id !== selected.id,
                          );
                          if (key !== "resolved")
                            newState.resolved = [
                              selected,
                              ...newState.resolved,
                            ];
                          break;
                        }
                      }
                      return newState;
                    });
                    setSelected(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New complaint modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">New Complaint</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Title", placeholder: "Brief complaint title" },
                { label: "Room Number", placeholder: "e.g. 202A" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed description..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>Maintenance</option>
                    <option>Sanitation</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
