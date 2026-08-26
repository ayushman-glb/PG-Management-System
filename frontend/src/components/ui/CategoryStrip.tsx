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
    <div className={`w-full border-b border-[#dddddd] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] sticky top-20 z-30 transition-colors ${className}`}>
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
                className={`relative flex flex-col items-center gap-2 pb-2.5 flex-shrink-0 cursor-pointer transition-all duration-150 group ${
                  isSelected
                    ? "text-[#222222] dark:text-[#f7f7f7] font-semibold"
                    : "text-[#6a6a6a] dark:text-[#a1a1aa] hover:text-[#222222] dark:hover:text-[#f7f7f7]"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isSelected ? "text-[#222222] dark:text-[#f7f7f7]" : "opacity-75 group-hover:opacity-100"
                    }`}
                  />
                  {cat.isNew && (
                    <span className="absolute -top-1.5 -right-3 text-[8px] font-bold uppercase tracking-wider bg-[#ff385c] text-white px-1 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-xs whitespace-nowrap">{cat.label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] dark:bg-[#f7f7f7] rounded-full" />
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
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#dddddd] dark:border-[#2e2e2e] text-xs font-semibold text-[#222222] dark:text-[#f7f7f7] hover:border-black dark:hover:border-white transition-colors flex-shrink-0 cursor-pointer"
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
