import request from 'supertest';
import { app } from '../app';

jest.setTimeout(15000);

describe('RoomBae Enterprise Backend - Resident & Bed Management Unit & Integration Suite', () => {


  describe('REST Endpoint Validation & RBAC Controls', () => {
    it('POST /api/v1/resident-management/status - should fail gracefully with missing residentId', async () => {
      const res = await request(app)
        .post('/api/v1/resident-management/status')
        .send({ status: 'ACTIVE' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/resident-management/transfers - should return 200 OK with transfer requests array', async () => {
      const res = await request(app).get('/api/v1/resident-management/transfers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/beds/holds - should return 200 OK with active bed holds', async () => {
      const res = await request(app).get('/api/v1/resident-management/beds/holds');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/audit-logs - should return 200 OK with audit logs list', async () => {
      const res = await request(app).get('/api/v1/resident-management/audit-logs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/resident-management/notifications - should return 200 OK with user notifications', async () => {
      const res = await request(app).get('/api/v1/resident-management/notifications');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/resident-management/rooms/convert - should reject conversion missing roomId', async () => {
      const res = await request(app)
        .post('/api/v1/resident-management/rooms/convert')
        .send({ newType: 'DOUBLE' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

});
