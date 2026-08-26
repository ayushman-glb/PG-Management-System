import { useState, useEffect } from "react";
import {
  Plus,
  MessageSquare,
  X,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import { Avatar } from "@components/ui/Avatar";
import { AnimatedBadge } from "@components/animations/MotionPrimitives";
import type { Page } from "@app/App";
import { useTheme } from "@theme/index";
import { api } from "@services/api";
import { useAdaptiveLoading } from "../../../hooks/useAdaptiveLoading";
import { ComplaintsSkeleton } from "@components/Skeletons";

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
  pending: [],
  inProgress: [],
  resolved: [],
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
  const { darkMode } = useTheme();

  const { showSkeleton } = useAdaptiveLoading(
    async () => {
      try {
        const res = await api.listComplaints();
        if (res && typeof res === "object") {
          // Normalize if res returns categorized or array
          return res;
        }
      } catch {}
      return initialComplaints;
    },
    []
  );

  useEffect(() => {
    api.listComplaints().then(res => {
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data)) {
        const pending: Complaint[] = [];
        const inProgress: Complaint[] = [];
        const resolved: Complaint[] = [];

        data.forEach((c: any) => {
          const item: Complaint = {
            id: c.id || c.ticketCode,
            title: c.title,
            resident: c.resident?.profile?.name || c.resident?.username || "Resident",
            room: c.room?.roomNumber || "101",
            priority: c.priority === "HIGH" || c.priority === "URGENT" ? "High" : c.priority === "MEDIUM" ? "Medium" : "Low",
            category: c.category,
            date: new Date(c.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
            avatar: (c.resident?.profile?.name || c.resident?.username || "RS").substring(0, 2).toUpperCase(),
            desc: c.description
          };
          if (c.status === "OPEN") pending.push(item);
          else if (c.status === "IN_PROGRESS") inProgress.push(item);
          else resolved.push(item);
        });

        setComplaints({ pending, inProgress, resolved });
      } else {
        setComplaints({ pending: [], inProgress: [], resolved: [] });
      }
    }).catch(() => {
      setComplaints({ pending: [], inProgress: [], resolved: [] });
    });
  }, []);

  if (showSkeleton) {
    return <ComplaintsSkeleton />;
  }

  const handleCreateComplaint = async (title: string, category: string, description: string, priority: string) => {
    try {
      await api.post("/complaints", {
        title,
        category,
        description,
        priority,
      });

      setShowModal(false);
    } catch {
      setShowModal(false);
    }
  };

  const handleDrop = (targetCol: string) => {
    if (!dragging || dragging.from === targetCol) return;
    const { complaint, from } = dragging;

    const backendStatus = targetCol === "pending" ? "OPEN" : targetCol === "inProgress" ? "IN_PROGRESS" : "RESOLVED";
    api.updateComplaintStatus(complaint.id, backendStatus).catch(() => {});

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
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Complaint Management
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Track and resolve resident complaints — {resolvedCount}/{total}{" "}
              resolved
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 luxury-btn-primary text-sm font-semibold px-5 py-2.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Complaint
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl p-5 text-center ${darkMode ? "bg-slate-800 border border-slate-700" : `${col.bg} border ${col.border}`}`}
            >
              <p className={`text-3xl font-black ${col.color}`}>
                {complaints[col.id].length}
              </p>
              <p
                className={`text-sm font-medium mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                {col.label}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-3 gap-4 min-w-[600px]">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "bg-slate-800 border-slate-700" : `${col.bg} ${col.border}`}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                  <span className={`font-bold text-sm ${col.color}`}>
                    {col.label}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${col.color} px-2 py-0.5 rounded-full ${darkMode ? "bg-slate-700" : "bg-white/60"}`}
                >
                  {complaints[col.id].length}
                </span>
              </div>

              <div className="p-3 space-y-3 min-h-64">
                {complaints[col.id].map((complaint) => {
                  return (
                    <div
                      key={complaint.id}
                      draggable
                      onDragStart={() =>
                        setDragging({ complaint, from: col.id })
                      }
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setSelected(complaint)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all select-none focus-visible:ring-2 ${darkMode ? "bg-slate-700 border-slate-600 hover:border-[#ff385c] hover:shadow-lg focus-visible:ring-[#ff385c]" : "bg-white border-slate-100 hover:border-[#ff385c] hover:shadow-md focus-visible:ring-[#ff385c]"}`}
                      tabIndex={0}
                      role="button"
                      aria-label={`View complaint: ${complaint.title}`}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(complaint)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span
                              className={`text-xs font-mono ${darkMode ? "text-slate-400" : "text-slate-400"}`}
                            >
                              {complaint.id}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${darkMode ? "bg-slate-600 text-slate-300" : "bg-slate-100 text-slate-500"}`}
                            >
                              {complaint.category}
                            </span>
                          </div>
                          <h4
                            className={`font-semibold text-sm leading-snug ${darkMode ? "text-slate-100" : "text-slate-900"}`}
                          >
                            {complaint.title}
                          </h4>
                        </div>
                        <AnimatedBadge
                          label={complaint.priority}
                          variant={complaint.priority === "High" ? "danger" : complaint.priority === "Medium" ? "warning" : "neutral"}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={complaint.resident} initials={complaint.avatar} size="xs" />
                          <div>
                            <p
                              className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {complaint.resident}
                            </p>
                            <p
                              className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                            >
                              Room {complaint.room}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {complaint.date}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {complaints[col.id].length === 0 && (
                  <div
                    className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl ${darkMode ? "border-slate-600" : "border-slate-200"}`}
                  >
                    <CheckCircle
                      className={`w-5 h-5 mb-1 ${darkMode ? "text-slate-600" : "text-slate-300"}`}
                    />
                    <p
                      className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                      No complaints
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-detail-title"
            className={`rounded-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "bg-slate-700" : "bg-orange-50"}`}
                >
                  <MessageSquare
                    className={`w-5 h-5 ${darkMode ? "text-orange-400" : "text-orange-600"}`}
                  />
                </div>
                <div>
                  <h3
                    id="complaint-detail-title"
                    className={`font-bold text-lg leading-snug ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {selected.title}
                  </h3>
                  <p
                    className={`text-xs font-mono ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {selected.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close complaint details"
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p
                className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                {selected.desc}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Resident", value: selected.resident },
                  { label: "Room", value: selected.room },
                  { label: "Category", value: selected.category },
                  { label: "Date", value: selected.date },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 ${darkMode ? "bg-slate-700" : "bg-slate-50"}`}
                  >
                    <p
                      className={`text-xs mb-0.5 ${darkMode ? "text-slate-400" : "text-slate-400"}`}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
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
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-complaint-title"
            className={`rounded-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}
            >
              <h3
                className={`font-bold ${darkMode ? "text-[#f7f7f7]" : "text-[#222222]"}`}
              >
                New Complaint
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Title", placeholder: "Brief complaint title" },
                { label: "Room Number", placeholder: "e.g. 202A" },
              ].map((f) => (
                <div key={f.label}>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-[#ff385c]" : "border-slate-200 text-slate-800 focus:ring-[#ff385c]"}`}
                  />
                </div>
              ))}
              <div>
                <label
                  className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed description..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-[#ff385c]" : "border-slate-200 text-slate-800 focus:ring-[#ff385c]"}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Priority
                  </label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white focus:ring-[#ff385c]" : "bg-white border-slate-200 focus:ring-[#ff385c]"}`}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Category
                  </label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white focus:ring-[#ff385c]" : "bg-white border-slate-200 focus:ring-[#ff385c]"}`}
                  >
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>Maintenance</option>
                    <option>Sanitation</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              className={`flex gap-3 px-6 py-4 border-t ${darkMode ? "border-slate-700" : "border-slate-100"}`}
            >
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateComplaint("General Issue", "Maintenance", "Detailed complaint description", "High")}
                className="flex-1 py-2.5 luxury-btn-primary text-sm font-semibold flex-shrink-0"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
