import React from "react";
import { FolderOpen } from "lucide-react";
import { useTheme } from "@theme/index";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data found",
  description = "There are no records to display at this time.",
  icon = <FolderOpen className="w-12 h-12 text-amber-500 opacity-60" />,
  action,
}) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border ${
        darkMode ? "bg-[#252220] border-[#3D3632]" : "bg-[#FFFDFB] border-[#E6D7CA]"
      }`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className={`text-lg font-bold mb-1 ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
        {title}
      </h3>
      <p className={`text-sm max-w-sm mb-6 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
        {description}
      </p>
      {action}
    </div>
  );
};
