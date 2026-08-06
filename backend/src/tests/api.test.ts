import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../app';

describe('RoomBae Enterprise Backend - API Validation & White-Box Suite', () => {

  describe('Phase 15 - System Diagnostics & Probes', () => {
    it('GET /health - should return 200 OK with system telemetry and database status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
      expect(res.body.memory).toHaveProperty('rssMB');
      expect(res.body.database).toHaveProperty('status');
      expect(res.body.services.restApi).toBe('READY');
    });

    it('GET /ready - should return 200 OK for load balancer readiness', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
    });

    it('GET /live - should return 200 OK for liveness check', async () => {
      const res = await request(app).get('/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ALIVE');
    });
  });

  describe('Phase 9 - Swagger / OpenAPI Specifications', () => {
    it('GET /api/docs.json - should return valid OpenAPI 3.0 specification', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toContain('RoomBae');
      expect(res.body.paths).toHaveProperty('/health');
    });
  });

  describe('Phase 3 & 12 - REST API & Security Audit', () => {
    it('POST /api/v1/auth/login - should return 400 or 422 for missing request body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      expect([400, 422]).toContain(res.status);
    });


    it('GET /api/v1/properties/public - should return 200 OK with public PG listings', async () => {
      const res = await request(app).get('/api/v1/properties/public');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.properties)).toBe(true);
    });

    it('GET /api/v1/residents/directory - should return 401 Unauthorized without auth header', async () => {
      const res = await request(app).get('/api/v1/residents/directory');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/unknown-route - should return 404 Not Found', async () => {
      const res = await request(app).get('/api/v1/unknown-route');
      expect(res.status).toBe(404);
    });
  });

});
