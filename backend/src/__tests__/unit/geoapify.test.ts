import { GeoapifyService } from '../../modules/geoapify/geoapify.service';
import { GeoapifyClient } from '../../modules/geoapify/geoapify.client';
import { GeoapifyRawResponse } from '../../modules/geoapify/geoapify.types';

describe('GeoapifyService Unit Tests', () => {
  let mockClient: jest.Mocked<GeoapifyClient>;
  let mockPrisma: any;
  let service: GeoapifyService;

  beforeEach(() => {
    mockClient = {
      isConfigured: jest.fn().mockReturnValue(true),
      autocomplete: jest.fn(),
      geocode: jest.fn(),
      reverseGeocode: jest.fn(),
    } as any;

    mockPrisma = {
      pGLocation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new GeoapifyService(mockClient, mockPrisma);
  });

  it('should normalize Geoapify Indian address autocomplete responses correctly', async () => {
    const mockApiResponse: GeoapifyRawResponse = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            place_id: '51d7bf908',
            formatted: 'Koramangala, Bengaluru, Karnataka 560034, India',
            name: 'Koramangala',
            city: 'Bengaluru',
            suburb: 'Koramangala',
            district: 'Bengaluru Urban',
            state: 'Karnataka',
            country: 'India',
            postcode: '560034',
            lat: 12.9352,
            lon: 77.6245,
            result_type: 'suburb',
          },
          geometry: {
            type: 'Point',
            coordinates: [77.6245, 12.9352],
          },
        },
      ],
    };

    mockClient.autocomplete.mockResolvedValueOnce(mockApiResponse);

    const results = await service.getAutocomplete('Koramangala', 5);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: '51d7bf908',
      formattedAddress: 'Koramangala, Bengaluru, Karnataka 560034, India',
      name: 'Koramangala',
      city: 'Bengaluru',
      locality: 'Koramangala',
      suburb: 'Koramangala',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      country: 'India',
      postcode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      resultType: 'suburb',
    });
  });

  it('should cache autocomplete results and avoid repeated external API requests', async () => {
    const mockApiResponse: GeoapifyRawResponse = {
      features: [
        {
          type: 'Feature',
          properties: {
            place_id: 'hsr_layout',
            formatted: 'HSR Layout, Bengaluru, Karnataka, India',
            name: 'HSR Layout',
            city: 'Bengaluru',
            suburb: 'HSR Layout',
            state: 'Karnataka',
            country: 'India',
            lat: 12.9121,
            lon: 77.6446,
          },
          geometry: {
            type: 'Point',
            coordinates: [77.6446, 12.9121],
          },
        },
      ],
    };

    mockClient.autocomplete.mockResolvedValueOnce(mockApiResponse);

    const firstCall = await service.getAutocomplete('HSR Layout');
    const secondCall = await service.getAutocomplete('HSR Layout');

    expect(firstCall).toEqual(secondCall);
    expect(mockClient.autocomplete).toHaveBeenCalledTimes(1);
  });

  it('should fall back gracefully to MongoDB PGLocation records if external Geoapify fails', async () => {
    mockClient.autocomplete.mockRejectedValueOnce(new Error('Network Timeout'));
    mockPrisma.pGLocation.findMany.mockResolvedValueOnce([
      {
        id: 'loc_123',
        address: '100ft Road, Indiranagar',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India',
        latitude: 12.9784,
        longitude: 77.6408,
      },
    ]);

    const results = await service.getAutocomplete('Indiranagar');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Indiranagar');
    expect(results[0].city).toBe('Bengaluru');
    expect(results[0].latitude).toBe(12.9784);
  });

  it('should return empty array for empty search queries without calling API', async () => {
    const results = await service.getAutocomplete('   ');
    expect(results).toEqual([]);
    expect(mockClient.autocomplete).not.toHaveBeenCalled();
  });
});
