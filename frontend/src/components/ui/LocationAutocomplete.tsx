import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Loader2, Navigation } from 'lucide-react';
import { LocationModel, useSearchStore } from '../../store/useSearchStore';
import { searchService } from '../../services/search.service';

interface LocationAutocompleteProps {
  onSelect?: (location: LocationModel) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  initialValue?: string;
  autoFocus?: boolean;
}

const POPULAR_LOCALITIES: LocationModel[] = [
  {
    id: 'pop_koramangala',
    name: 'Koramangala',
    formattedAddress: 'Koramangala, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    locality: 'Koramangala',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9352,
    longitude: 77.6245,
    resultType: 'suburb',
  },
  {
    id: 'pop_hsr',
    name: 'HSR Layout',
    formattedAddress: 'HSR Layout, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    locality: 'HSR Layout',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9121,
    longitude: 77.6446,
    resultType: 'suburb',
  },
  {
    id: 'pop_indiranagar',
    name: 'Indiranagar',
    formattedAddress: 'Indiranagar, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    locality: 'Indiranagar',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9784,
    longitude: 77.6408,
    resultType: 'suburb',
  },
  {
    id: 'pop_whitefield',
    name: 'Whitefield',
    formattedAddress: 'Whitefield, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    locality: 'Whitefield',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9698,
    longitude: 77.7499,
    resultType: 'suburb',
  },
  {
    id: 'pop_hitec',
    name: 'HITEC City',
    formattedAddress: 'HITEC City, Hyderabad, Telangana, India',
    city: 'Hyderabad',
    locality: 'HITEC City',
    state: 'Telangana',
    country: 'India',
    latitude: 17.4435,
    longitude: 78.3772,
    resultType: 'suburb',
  },
];

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onSelect,
  placeholder = 'Search locality, landmark, or city...',
  className = '',
  inputClassName = '',
  initialValue,
  autoFocus = false,
}) => {
  const selectedLocation = useSearchStore((s) => s.selectedLocation);
  const setSelectedLocation = useSearchStore((s) => s.setSelectedLocation);

  const [query, setQuery] = useState(
    initialValue !== undefined ? initialValue : selectedLocation?.name || ''
  );
  const [suggestions, setSuggestions] = useState<LocationModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const debounceTimerRef = useRef<any>(null);

  // Sync initial query if selectedLocation updates externally (only when closed)
  useEffect(() => {
    if (!isOpen) {
      if (initialValue !== undefined) {
        setQuery(initialValue);
      } else if (selectedLocation?.name) {
        setQuery(selectedLocation.name);
      }
    }
  }, [selectedLocation, initialValue, isOpen]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup pending requests and timers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const performFetch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions(POPULAR_LOCALITIES);
      setIsLoading(false);
      return;
    }

    // 1. Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Track request sequence to ignore stale responses
    const currentSeq = ++requestSeqRef.current;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const results = await searchService.autocomplete(trimmed, controller.signal, 8);
      // Discard if newer request was dispatched
      if (currentSeq === requestSeqRef.current) {
        setSuggestions(results.length > 0 ? results : []);
        setHighlightedIndex(-1);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && currentSeq === requestSeqRef.current) {
        setErrorMessage('Unable to load suggestions. Using local matching.');
        setSuggestions(
          POPULAR_LOCALITIES.filter(
            (p) =>
              p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              p.city?.toLowerCase().includes(trimmed.toLowerCase())
          )
        );
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSuggestions(POPULAR_LOCALITIES);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performFetch(val);
    }, 300);
  };

  const handleSelect = (loc: LocationModel) => {
    setQuery(loc.name || loc.locality || loc.city || loc.formattedAddress);
    setSelectedLocation(loc);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect?.(loc);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setSelectedLocation(null);
    setSuggestions(POPULAR_LOCALITIES);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="location-autocomplete-list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `location-item-${highlightedIndex}` : undefined
          }
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (suggestions.length === 0 || !query.trim()) {
              setSuggestions(POPULAR_LOCALITIES);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full outline-none bg-transparent transition-colors placeholder:text-[var(--text-muted-soft)] ${inputClassName}`}
        />

        {/* Action icons: Spinner / Clear */}
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
          )}
          {query.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear location search"
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-nested)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="location-autocomplete-list"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto p-1.5 transition-all duration-200 animate-in fade-in slide-in-from-top-1"
        >
          {(query.trim().length < 2 || suggestions === POPULAR_LOCALITIES) && suggestions.length > 0 && (
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 border-b border-[var(--border-main)]/40 mb-1">
              <Navigation className="w-3 h-3 text-[var(--brand-primary)]" />
              Popular Tech Hubs & Localities
            </div>
          )}

          {suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No matching locations found in India. Try searching for a major area or city.
            </div>
          )}

          {suggestions.map((loc, idx) => {
            const isHighlighted = highlightedIndex === idx;
            return (
              <div
                key={loc.id || `${loc.name}-${idx}`}
                id={`location-item-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelect(loc)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-left ${
                  isHighlighted
                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'hover:bg-[var(--bg-nested)] text-[var(--text-main)]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    isHighlighted
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold truncate">
                    {loc.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {loc.formattedAddress}
                  </div>
                </div>
              </div>
            );
          })}

          {errorMessage && (
            <div className="px-3 py-2 text-[11px] text-amber-500 bg-amber-500/10 rounded-lg mt-1">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
