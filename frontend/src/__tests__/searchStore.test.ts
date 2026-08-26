import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from '../store/useSearchStore';

describe('useSearchStore Unit Tests', () => {
  beforeEach(() => {
    useSearchStore.getState().resetFilters();
  });

  it('should initialize with default Bengaluru location and recommended sort', () => {
    const state = useSearchStore.getState();
    expect(state.selectedLocation?.name).toBe('Bengaluru');
    expect(state.radiusKm).toBe(15);
    expect(state.genderType).toBe('ALL');
    expect(state.sortBy).toBe('recommended');
  });

  it('should update selected location and radius', () => {
    useSearchStore.getState().setSelectedLocation({
      id: 'loc_koramangala',
      name: 'Koramangala',
      formattedAddress: 'Koramangala, Bengaluru, Karnataka, India',
      city: 'Bengaluru',
      locality: 'Koramangala',
      latitude: 12.9352,
      longitude: 77.6245,
    });
    useSearchStore.getState().setRadiusKm(5);

    const state = useSearchStore.getState();
    expect(state.selectedLocation?.name).toBe('Koramangala');
    expect(state.selectedLocation?.latitude).toBe(12.9352);
    expect(state.radiusKm).toBe(5);
  });

  it('should toggle amenities cleanly', () => {
    useSearchStore.getState().toggleAmenity('WiFi');
    expect(useSearchStore.getState().amenities).toContain('WiFi');

    useSearchStore.getState().toggleAmenity('AC');
    expect(useSearchStore.getState().amenities).toEqual(['WiFi', 'AC']);

    useSearchStore.getState().toggleAmenity('WiFi');
    expect(useSearchStore.getState().amenities).toEqual(['AC']);
  });

  it('should reset filters back to baseline defaults', () => {
    useSearchStore.getState().setGenderType('GIRLS');
    useSearchStore.getState().setRoomType('SINGLE');
    useSearchStore.getState().setPriceRange([10000, 20000]);
    useSearchStore.getState().toggleAmenity('Food');

    useSearchStore.getState().resetFilters();

    const state = useSearchStore.getState();
    expect(state.genderType).toBe('ALL');
    expect(state.roomType).toBe('ALL');
    expect(state.amenities).toHaveLength(0);
    expect(state.priceRange).toEqual([4000, 30000]);
  });
});
