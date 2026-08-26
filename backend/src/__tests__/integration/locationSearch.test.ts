import request from 'supertest';
import { app } from '../../app';

describe('Search & Location Intelligence API Integration Tests', () => {
  it('GET /api/v1/search/locations/autocomplete should return HTTP 200 with suggestions', async () => {
    const res = await request(app)
      .get('/api/v1/search/locations/autocomplete?q=Koramangala')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Location suggestions retrieved successfully.');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/search/autocomplete (alias) should return HTTP 200', async () => {
    const res = await request(app)
      .get('/api/v1/search/autocomplete?q=HSR')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/search should return HTTP 200 with paginated properties', async () => {
    const res = await request(app)
      .get('/api/v1/search?city=Bengaluru&limit=5')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('limit');
  });

  it('GET /api/v1/search with coordinates should accept latitude, longitude, and radiusKm', async () => {
    const res = await request(app)
      .get('/api/v1/search?latitude=12.9352&longitude=77.6245&radiusKm=10')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.searchCenter).toEqual({
      latitude: 12.9352,
      longitude: 77.6245,
      radiusKm: 10,
    });
  });

  it('GET /api/v1/search/locations/reverse should return HTTP 400 for invalid coordinates', async () => {
    const res = await request(app)
      .get('/api/v1/search/locations/reverse?lat=invalid&lon=invalid')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_COORDINATES');
  });
});
