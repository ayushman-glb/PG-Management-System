import React from "react";
import {
  Sparkles,
  Building2,
  GraduationCap,
  Briefcase,
  Utensils,
  ShieldCheck,
  Flame,
  Wifi,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

import { NewBadge } from "./NewBadge";

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", label: "All PGs", icon: Building2 },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "luxury", label: "Luxury Co-Living", icon: Sparkles, isNew: true },
  { id: "student", label: "Student Living", icon: GraduationCap },
  { id: "tech", label: "Near Tech Parks", icon: Briefcase },
  { id: "meals", label: "Food Included", icon: Utensils },
  { id: "verified", label: "Verified Superhosts", icon: ShieldCheck },
  { id: "wifi", label: "High-Speed WiFi", icon: Wifi },
];

interface CategoryStripProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onOpenFilters?: () => void;
  className?: string;
}

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenFilters,
  className = "",
}) => {
  return (
    <div className={`w-full border-b border-[var(--border-main)] bg-[var(--bg-primary)] sticky top-20 z-30 transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4 py-3">
        {/* Horizontal Category Scroll */}
        <div className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`relative flex flex-col items-center gap-2 pb-2.5 flex-shrink-0 cursor-pointer transition-all duration-200 group ${
                  isSelected
                    ? "text-[var(--brand-primary)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${
                      isSelected ? "text-[var(--brand-primary)]" : "opacity-75 group-hover:opacity-100"
                    }`}
                  />
                  {cat.isNew && (
                    <NewBadge className="absolute -top-1.5 -right-3" />
                  )}
                </div>
                <span className="text-xs whitespace-nowrap">{cat.label}</span>
                {isSelected && (
                  <motion.span
                    layoutId="activeCategoryIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--brand-primary)] rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Optional Filter Trigger */}
        {onOpenFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--brand-primary)] transition-colors flex-shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryStrip;
