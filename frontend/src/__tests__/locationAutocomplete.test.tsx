import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete';
import { searchService } from '../services/search.service';
import { useSearchStore } from '../store/useSearchStore';

describe('LocationAutocomplete Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchStore.getState().resetFilters();
  });

  it('renders input with default placeholder and handles focus', () => {
    render(<LocationAutocomplete placeholder="Search area in India..." />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search area in India...');
  });

  it('displays popular tech hubs when focused with empty query', () => {
    render(<LocationAutocomplete />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText(/Popular Tech Hubs & Localities/i)).toBeInTheDocument();
    expect(screen.getByText('Koramangala')).toBeInTheDocument();
    expect(screen.getByText('HSR Layout')).toBeInTheDocument();
  });

  it('debounces and calls searchService.autocomplete when user types', async () => {
    const mockSuggestions = [
      {
        id: 'loc_saltlake',
        name: 'Salt Lake Sector 5',
        formattedAddress: 'Sector V, Salt Lake, Kolkata, West Bengal, India',
        city: 'Kolkata',
        locality: 'Salt Lake',
        latitude: 22.5804,
        longitude: 88.4378,
      },
    ];

    vi.spyOn(searchService, 'autocomplete').mockResolvedValueOnce(mockSuggestions);

    render(<LocationAutocomplete />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Salt Lake' } });

    await waitFor(
      () => {
        expect(searchService.autocomplete).toHaveBeenCalledWith('Salt Lake', expect.any(Object), 8);
      },
      { timeout: 1000 }
    );

    await waitFor(() => {
      expect(screen.getByText('Salt Lake Sector 5')).toBeInTheDocument();
    });
  });

  it('handles selecting a suggestion and invokes onSelect callback', async () => {
    const handleSelect = vi.fn();
    render(<LocationAutocomplete onSelect={handleSelect} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    const koramangalaOption = screen.getByText('Koramangala');
    fireEvent.click(koramangalaOption);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Koramangala',
        latitude: 12.9352,
        longitude: 77.6245,
      })
    );
    expect(input).toHaveValue('Koramangala');
  });

  it('clears search input when clear button is clicked', () => {
    render(<LocationAutocomplete initialValue="Whitefield" />);
    const clearButton = screen.getByRole('button', { name: /clear location search/i });

    fireEvent.click(clearButton);
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('');
  });
});
