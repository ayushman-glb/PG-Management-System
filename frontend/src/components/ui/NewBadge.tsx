import React from "react";

export interface NewBadgeProps {
  className?: string;
  children?: React.ReactNode;
}

export const NewBadge: React.FC<NewBadgeProps> = ({
  className = "",
  children = "NEW",
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center text-xs font-bold px-1.5 py-0.5 rounded-full bg-[var(--badge-new-bg)] text-[var(--badge-new-text)] tracking-wider uppercase select-none transition-colors ${className}`}
    >
      {children}
    </span>
  );
};

export default NewBadge;
