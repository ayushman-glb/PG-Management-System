import { SearchService } from '../../modules/search/search.service';

describe('SearchService Geospatial & Haversine Unit Tests', () => {
  let searchService: SearchService;
  let mockPrisma: any;
  let mockGeoapify: any;

  beforeEach(() => {
    mockGeoapify = {
      getAutocomplete: jest.fn(),
      geocode: jest.fn(),
      reverseGeocode: jest.fn(),
    };

    mockPrisma = {
      pG: {
        findMany: jest.fn(),
      },
    };

    searchService = new SearchService(mockGeoapify, mockPrisma);
  });

  describe('Haversine Formula Math Calculation', () => {
    it('should accurately calculate distance between Koramangala and HSR Layout (~3.5km)', () => {
      // Koramangala 5th Block: 12.9352, 77.6245
      // HSR Layout Sector 1: 12.9121, 77.6446
      const distance = searchService.calculateHaversineDistance(12.9352, 77.6245, 12.9121, 77.6446);
      expect(distance).toBeGreaterThan(3.0);
      expect(distance).toBeLessThan(4.0);
    });

    it('should return 0.00 for identical coordinate pairs', () => {
      const distance = searchService.calculateHaversineDistance(12.9716, 77.5946, 12.9716, 77.5946);
      expect(distance).toBe(0);
    });

    it('should calculate distance between Bengaluru and Indiranagar (~5km)', () => {
      // MG Road (Central Bengaluru): 12.9756, 77.6066
      // Indiranagar 100ft Road: 12.9784, 77.6408
      const distance = searchService.calculateHaversineDistance(12.9756, 77.6066, 12.9784, 77.6408);
      expect(distance).toBeGreaterThan(3.0);
      expect(distance).toBeLessThan(5.0);
    });
  });

  describe('searchPGs with Geospatial Radius & Ranking', () => {
    it('should filter candidate properties by radius and attach distanceKm', async () => {
      const mockDbPgs = [
        {
          id: 'pg_near',
          name: 'Koramangala Luxury PG',
          description: 'Near Sony World Signal',
          genderType: 'CO_LIVING',
          basePrice: 12000,
          status: 'APPROVED',
          location: {
            latitude: 12.9352,
            longitude: 77.6245,
            locality: 'Koramangala',
            city: 'Bengaluru',
          },
          images: [],
          amenities: [{ amenity: { name: 'WiFi' } }, { amenity: { name: 'AC' } }],
          mealPlans: [{ name: '3 Meals Included' }],
          reviews: [{ rating: 5 }, { rating: 5 }],
          floors: [
            {
              rooms: [
                {
                  roomType: 'SINGLE',
                  baseRent: 12000,
                  beds: [{ status: 'AVAILABLE' }],
                },
              ],
            },
          ],
        },
        {
          id: 'pg_far',
          name: 'Whitefield Tech PG',
          description: 'Near ITPL',
          genderType: 'CO_LIVING',
          basePrice: 9000,
          status: 'APPROVED',
          location: {
            latitude: 12.9856,
            longitude: 77.7314, // ~15km away from Koramangala
            locality: 'Whitefield',
            city: 'Bengaluru',
          },
          images: [],
          amenities: [{ amenity: { name: 'WiFi' } }],
          mealPlans: [],
          reviews: [{ rating: 4 }],
          floors: [
            {
              rooms: [
                {
                  roomType: 'DOUBLE',
                  baseRent: 9000,
                  beds: [{ status: 'AVAILABLE' }],
                },
              ],
            },
          ],
        },
      ];

      mockPrisma.pG.findMany.mockResolvedValueOnce(mockDbPgs);

      // Search with 5km radius from Koramangala
      const results = await searchService.searchPGs({
        latitude: 12.9352,
        longitude: 77.6245,
        radiusKm: 5,
      });

      expect(results.total).toBe(1);
      expect(results.pgs[0].id).toBe('pg_near');
      expect(results.pgs[0].distanceKm).toBe(0);
      expect(results.pgs[0].distanceText).toBe('0 km away');
      expect(results.pgs[0].hasAvailableBeds).toBe(true);
    });

    it('should filter properties by amenities', async () => {
      const mockDbPgs = [
        {
          id: 'pg_with_ac',
          name: 'AC Suites',
          description: 'Full AC and Food',
          genderType: 'BOYS',
          basePrice: 10000,
          location: { latitude: 12.93, longitude: 77.62 },
          images: [],
          amenities: [{ amenity: { name: 'AC' } }, { amenity: { name: 'WiFi' } }, { amenity: { name: 'Food' } }],
          mealPlans: [],
          reviews: [],
          floors: [],
        },
        {
          id: 'pg_no_ac',
          name: 'Standard Stay',
          description: 'Only WiFi',
          genderType: 'BOYS',
          basePrice: 7000,
          location: { latitude: 12.93, longitude: 77.62 },
          images: [],
          amenities: [{ amenity: { name: 'WiFi' } }],
          mealPlans: [],
          reviews: [],
          floors: [],
        },
      ];

      mockPrisma.pG.findMany.mockResolvedValueOnce(mockDbPgs);

      const results = await searchService.searchPGs({
        amenities: ['AC', 'Food'],
      });

      expect(results.total).toBe(1);
      expect(results.pgs[0].id).toBe('pg_with_ac');
    });
  });
});
