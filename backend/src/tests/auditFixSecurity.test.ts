import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../app';
import { PdfKitInvoiceService } from '../infrastructure/pdf/PdfKitInvoiceService';

describe('Audit Fix Security & PDF Infrastructure Suite (F-01..F-08)', () => {

  describe('F-02 & F-04: Owner Route Authentication & Token Query Parameter Security', () => {
    it('GET /api/v1/owners - should return 401 Unauthorized without auth header', async () => {
      const res = await request(app).get('/api/v1/owners');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/owners/profile - should return 401 Unauthorized without auth header', async () => {
      const res = await request(app).get('/api/v1/owners/profile');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/owners?token=mockToken - should reject query token and return 401', async () => {
      const res = await request(app).get('/api/v1/owners?token=mockToken');
      expect(res.status).toBe(401);
    });
  });

  describe('F-01: Document Downloads Route Registration Order', () => {
    it('GET /api/v1/documents/invoice/pay_123 - should hit named route and require 401 auth', async () => {
      const res = await request(app).get('/api/v1/documents/invoice/pay_123');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/documents/receipt/pay_123 - should hit named receipt route and require 401 auth', async () => {
      const res = await request(app).get('/api/v1/documents/receipt/pay_123');
      expect(res.status).toBe(401);
    });
  });

  describe('F-05: PDFKit Invoice Service Generation & Buffer Integrity', () => {
    it('PdfKitInvoiceService - should generate valid non-empty PDF buffer starting with %PDF-', async () => {
      const pdfService = new PdfKitInvoiceService();
      const mockPayment = {
        id: 'pay_test_999',
        amount: 15000,
        currency: 'INR',
        status: 'PAID',
        createdAt: new Date(),
        resident: {
          user: { name: 'Rahul Sharma', email: 'rahul@roombae.com' },
          room: { roomNumber: '101-A' }
        },
        pgProperty: { name: 'RoomBae Executive PG HSR' }
      };

      const buffer = await pdfService.generateInvoicePdfBuffer(mockPayment);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
    });
  });

});
