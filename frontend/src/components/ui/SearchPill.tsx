import React, { useState } from "react";
import { Search } from "lucide-react";

export interface SearchFilterState {
  location: string;
  checkIn: string;
  guests: string;
}

interface SearchPillProps {
  onSearch?: (filters: SearchFilterState) => void;
  className?: string;
  compact?: boolean;
}

export const SearchPill: React.FC<SearchPillProps> = ({
  onSearch,
  className = "",
  compact = false,
}) => {
  const [location, setLocation] = useState("Bengaluru, India");
  const [checkIn] = useState("Anytime");
  const [guests] = useState("Single / Double Sharing");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ location, checkIn, guests });
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`search-pill relative mx-auto flex items-center justify-between transition-all duration-200 ${
        compact
          ? "h-12 max-w-md px-3 text-xs"
          : "h-16 max-w-3xl px-4 md:px-6 text-sm"
      } ${className}`}
    >
      {/* Segment 1: Where */}
      <div
        className="flex-1 px-3 py-2 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left"
      >
        <div className="text-[11px] font-bold tracking-wider text-[#222222] dark:text-[#f7f7f7]">
          Where
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search destinations"
          className="w-full bg-transparent text-xs md:text-sm font-medium text-[#6a6a6a] dark:text-[#a1a1aa] outline-none truncate"
        />
      </div>

      {/* Hairline Divider */}
      <div className="h-8 w-[1px] bg-[#dddddd] dark:bg-[#2e2e2e]" />

      {/* Segment 2: When */}
      <div
        className="hidden sm:block flex-1 px-4 py-2 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left"
      >
        <div className="text-[11px] font-bold tracking-wider text-[#222222] dark:text-[#f7f7f7]">
          When
        </div>
        <div className="text-xs md:text-sm font-medium text-[#6a6a6a] dark:text-[#a1a1aa] truncate">
          {checkIn}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="hidden sm:block h-8 w-[1px] bg-[#dddddd] dark:bg-[#2e2e2e]" />

      {/* Segment 3: Who */}
      <div
        className="hidden md:block flex-1 px-4 py-2 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left"
      >
        <div className="text-[11px] font-bold tracking-wider text-[#222222] dark:text-[#f7f7f7]">
          Who
        </div>
        <div className="text-xs md:text-sm font-medium text-[#6a6a6a] dark:text-[#a1a1aa] truncate">
          {guests}
        </div>
      </div>

      {/* Search Orb */}
      <button
        type="submit"
        aria-label="Search"
        className="search-orb cursor-pointer flex-shrink-0 ml-2"
      >
        <Search className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>
    </form>
  );
};

export default SearchPill;
