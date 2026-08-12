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

describe('RoomBae Enterprise Backend - Resident & Bed Management Unit & Integration Suite', () => {

  describe('REST Endpoint Validation & RBAC Controls', () => {
    it('POST /api/v1/resident-management/status - should fail gracefully with missing residentId', async () => {
      const res = await request(app)
        .post('/api/v1/resident-management/status')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'ACTIVE' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/resident-management/transfers - should return 200 OK with transfer requests array', async () => {
      const res = await request(app)
        .get('/api/v1/resident-management/transfers')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/beds/holds - should return 200 OK with active bed holds', async () => {
      const res = await request(app)
        .get('/api/v1/resident-management/beds/holds')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/audit-logs - should return 200 OK with audit logs list', async () => {
      const res = await request(app)
        .get('/api/v1/resident-management/audit-logs')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/notifications - should return 200 OK with user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/resident-management/notifications')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/resident-management/rooms/convert - should reject conversion missing roomId', async () => {
      const res = await request(app)
        .post('/api/v1/resident-management/rooms/convert')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ newType: 'DOUBLE' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

});
