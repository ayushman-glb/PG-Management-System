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
        className="flex-1 px-3.5 py-3 cursor-pointer rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex flex-col gap-0.5"
      >
        <div className="text-xs font-semibold tracking-normal text-[var(--text-main)]">
          Where
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search destinations"
          className="w-full bg-transparent text-xs md:text-sm font-medium text-[var(--text-muted)] outline-none truncate placeholder:text-[var(--text-muted-soft)]"
        />
      </div>

      {/* Hairline Divider */}
      <div className="h-8 w-[1px] bg-[var(--border-main)]" />

      {/* Segment 2: When */}
      <div
        className="hidden sm:flex flex-1 px-4 py-3 cursor-pointer rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex-col gap-0.5"
      >
        <div className="text-xs font-semibold tracking-normal text-[var(--text-main)]">
          When
        </div>
        <div className="text-xs md:text-sm font-medium text-[var(--text-muted)] truncate">
          {checkIn}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="hidden sm:block h-8 w-[1px] bg-[var(--border-main)]" />

      {/* Segment 3: Who */}
      <div
        className="hidden md:flex flex-1 px-4 py-3 cursor-pointer rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex-col gap-0.5"
      >
        <div className="text-xs font-semibold tracking-normal text-[var(--text-main)]">
          Who
        </div>
        <div className="text-xs md:text-sm font-medium text-[var(--text-muted)] truncate">
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
