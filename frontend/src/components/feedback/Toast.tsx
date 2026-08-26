import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useTheme } from "@theme/index";

export interface ToastProps {
  id: string;
  type?: "success" | "warning" | "error" | "info";
  message: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type = "info", message, onClose }) => {
  const { darkMode } = useTheme();

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 ${
        darkMode ? "bg-[#2A2725] border-[var(--border-main)] text-[var(--text-main)]" : "bg-white border-[var(--border-main)] text-[var(--text-main)]"
      }`}
    >
      {iconMap[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded-md hover:opacity-75 transition-opacity"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};
