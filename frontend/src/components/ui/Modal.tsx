import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "@theme/index";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} rounded-2xl border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto ${
          darkMode
            ? "bg-[#252220] border-[#4A443F] text-[#F7F3EE]"
            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/20 mb-4">
          {title && <div className="text-lg font-bold">{title}</div>}
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? "hover:bg-[#332D2B] text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
