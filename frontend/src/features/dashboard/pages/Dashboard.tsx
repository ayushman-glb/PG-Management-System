import { useState } from "react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import { BentoDashboard } from "@features/dashboard/components/BentoDashboard";
import { KanbanBoards } from "@features/complaints/components/KanbanBoards";
import { ResidentProfileModal } from "@features/residents/components/ResidentProfileModal";
import type { Page } from "@/app/App";
import { useTheme } from "../../../theme";
import { api } from "@services/api";
import { LayoutGrid, Kanban, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { useAdaptiveLoading } from "@hooks/useAdaptiveLoading";
import { DashboardSkeleton } from "@components/Skeletons";

interface Props {
  navigate: (p: Page) => void;
}

export default function Dashboard({ navigate }: Props) {
  const { darkMode } = useTheme();
  const [viewMode, setViewMode] = useState<"bento" | "kanban">("bento");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

  const { showSkeleton } = useAdaptiveLoading(
    () => api.getOwnerSummary(),
    []
  );

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardLayout navigate={navigate} activePage="dashboard">
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl md:text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                RoomBae Command Center 👋
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Realtime
              </span>
            </div>
            <p className={`text-xs md:text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>
              Multi-property co-living metrics, resident status workflows, and interactive Kanban boards.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setViewMode("bento")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "bento"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Bento Dashboard
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Kanban className="w-4 h-4" /> 5-Kanban Workflows
            </button>
          </div>
        </div>

        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === "bento" ? (
            <BentoDashboard />
          ) : (
            <KanbanBoards onSelectResident={(id) => setSelectedResidentId(id)} />
          )}
        </motion.div>

        <ResidentProfileModal
          residentId={selectedResidentId}
          onClose={() => setSelectedResidentId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
