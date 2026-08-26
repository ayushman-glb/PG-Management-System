import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchStore, LocationModel, RoomTypeFilter } from '../../store/useSearchStore';
import { LocationAutocomplete } from './LocationAutocomplete';

export interface SearchFilterState {
  location: string;
  checkIn: string;
  guests: string;
  selectedLocation?: LocationModel | null;
}

interface SearchPillProps {
  onSearch?: (filters: SearchFilterState) => void;
  className?: string;
  compact?: boolean;
}

export const SearchPill: React.FC<SearchPillProps> = ({
  onSearch,
  className = '',
  compact = false,
}) => {
  const selectedLocation = useSearchStore((s) => s.selectedLocation);
  const setSelectedLocation = useSearchStore((s) => s.setSelectedLocation);
  const roomType = useSearchStore((s) => s.roomType);
  const setRoomType = useSearchStore((s) => s.setRoomType);

  const [checkIn] = useState('Anytime');
  const [guestsLabel, setGuestsLabel] = useState(
    roomType === 'SINGLE'
      ? 'Single Sharing'
      : roomType === 'DOUBLE'
      ? 'Double Sharing'
      : roomType === 'TRIPLE'
      ? 'Triple Sharing'
      : 'Single / Double Sharing'
  );
  const [showRoomTypeDropdown, setShowRoomTypeDropdown] = useState(false);

  const handleSelectRoomType = (type: RoomTypeFilter, label: string) => {
    setRoomType(type);
    setGuestsLabel(label);
    setShowRoomTypeDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({
      location: selectedLocation?.formattedAddress || selectedLocation?.name || 'Bengaluru, India',
      checkIn,
      guests: guestsLabel,
      selectedLocation,
    });
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`search-pill relative mx-auto flex items-center justify-between transition-all duration-200 ${
        compact
          ? 'h-12 max-w-md px-3 text-xs'
          : 'h-16 max-w-3xl px-4 md:px-6 text-sm'
      } ${className}`}
    >
      {/* Segment 1: Where (Location Autocomplete with Geoapify) */}
      <div className="flex-1 px-3.5 py-2 rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex flex-col gap-0.5 min-w-0">
        <label
          htmlFor="search-pill-location"
          className="text-[10px] sm:text-xs font-semibold tracking-normal text-[var(--text-main)]"
        >
          Where
        </label>
        <LocationAutocomplete
          onSelect={(loc) => setSelectedLocation(loc)}
          placeholder="Search localities (e.g. Koramangala, HSR)"
          inputClassName="text-xs md:text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted-soft)]"
        />
      </div>

      {/* Hairline Divider */}
      <div className="h-8 w-[1px] bg-[var(--border-main)]" />

      {/* Segment 2: When */}
      <div className="hidden sm:flex flex-1 px-4 py-2 rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex-col gap-0.5 cursor-pointer">
        <div className="text-[10px] sm:text-xs font-semibold tracking-normal text-[var(--text-main)]">
          When
        </div>
        <div className="text-xs md:text-sm font-medium text-[var(--text-muted)] truncate">
          {checkIn}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="hidden sm:block h-8 w-[1px] bg-[var(--border-main)]" />

      {/* Segment 3: Who / Sharing Type */}
      <div className="relative hidden md:flex flex-1 px-4 py-2 rounded-full hover:bg-[var(--bg-surface)] transition-colors text-left flex-col gap-0.5 cursor-pointer">
        <div
          onClick={() => setShowRoomTypeDropdown(!showRoomTypeDropdown)}
          className="w-full"
        >
          <div className="text-[10px] sm:text-xs font-semibold tracking-normal text-[var(--text-main)]">
            Who
          </div>
          <div className="text-xs md:text-sm font-medium text-[var(--text-muted)] truncate">
            {guestsLabel}
          </div>
        </div>

        {/* Room Type Dropdown */}
        {showRoomTypeDropdown && (
          <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => handleSelectRoomType('ALL', 'All Sharing Types')}
              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[var(--bg-nested)] text-[var(--text-main)] transition-colors"
            >
              All Sharing Types
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoomType('SINGLE', 'Single Sharing')}
              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[var(--bg-nested)] text-[var(--text-main)] transition-colors"
            >
              Single Sharing
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoomType('DOUBLE', 'Double Sharing')}
              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[var(--bg-nested)] text-[var(--text-main)] transition-colors"
            >
              Double Sharing
            </button>
            <button
              type="button"
              onClick={() => handleSelectRoomType('TRIPLE', 'Triple Sharing')}
              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[var(--bg-nested)] text-[var(--text-main)] transition-colors"
            >
              Triple Sharing
            </button>
          </div>
        )}
      </div>

      {/* Search Button Orb */}
      <button
        type="submit"
        aria-label="Search PGs"
        className="search-orb cursor-pointer flex-shrink-0 ml-2"
      >
        <Search className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>
    </form>
  );
};

export default SearchPill;
