import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';

jest.setTimeout(15000);

const secret = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';
const testToken = jwt.sign(
  { id: '507f1f77bcf86cd799439011', email: 'owner1@roombae.com', role: 'OWNER' },
  secret
);

describe('RoomBae Enterprise Backend - Canonical Resident & Bed Management Route Suite', () => {

  describe('REST Endpoint Validation & RBAC Controls', () => {
    it('PATCH /api/v1/residents/:residentId/status - should fail gracefully with non-existent resident', async () => {
      const res = await request(app)
        .patch('/api/v1/residents/507f1f77bcf86cd799439099/status')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'ACTIVE' });
      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/rooms/transfer-requests - should return 200 OK with transfer requests array', async () => {
      const res = await request(app)
        .get('/api/v1/rooms/transfer-requests')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/beds/holds - should return 200 OK with active bed holds', async () => {
      const res = await request(app)
        .get('/api/v1/beds/holds')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/settings/audit-logs - should return 200 OK with audit logs list', async () => {
      const res = await request(app)
        .get('/api/v1/settings/audit-logs')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/notifications - should return 200 OK with user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PUT /api/v1/rooms/:roomId/convert - should reject conversion missing capacity or valid type', async () => {
      const res = await request(app)
        .put('/api/v1/rooms/507f1f77bcf86cd799439099/convert')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ newType: 'INVALID_TYPE' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

});
