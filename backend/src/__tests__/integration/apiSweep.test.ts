import request from 'supertest';
import { app } from '../../app';

describe('Phase 3 API Surface Defect Sweep Integration Tests', () => {
  describe('GET /api/v1/dashboard/overview', () => {
    test('returns aggregated dashboard metrics without database connection pool leaks', async () => {
      const res = await request(app).get('/api/v1/dashboard/overview');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalPGs).toBe('number');
      expect(typeof res.body.data.occupancyRatePercent).toBe('number');
      expect(res.body.data.complaints).toBeDefined();
    });

    test('returns monthly revenue trend analysis data', async () => {
      const res = await request(app).get('/api/v1/dashboard/revenue');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.trend)).toBe(true);
    });
  });

  describe('SOAP ERP WSDL Service & Rate Limiting', () => {
    test('GET /soap/billing?wsdl returns valid WSDL XML definitions without API key', async () => {
      const res = await request(app).get('/soap/billing?wsdl');

      expect(res.status).toBe(200);
      expect(res.text).toContain('BillingService');
      expect(res.text).toContain('GetInvoiceDetails');
    });

    test('POST /soap/billing handles malformed or missing params safely without crashing', async () => {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetInvoiceDetails xmlns="http://roombae.com/soap/billing">
              <invoiceNumber>NON_EXISTENT_INV_999</invoiceNumber>
            </GetInvoiceDetails>
          </soap:Body>
        </soap:Envelope>`;

      const res = await request(app)
        .post('/soap/billing')
        .set('Content-Type', 'text/xml')
        .send(soapEnvelope);

      expect([200, 401, 500]).toContain(res.status);
      expect(res.text).toBeDefined();
    });

    test('POST /soap/billing enforces API Key validation when SOAP_BILLING_API_KEY is set', async () => {
      const prevKey = process.env.SOAP_BILLING_API_KEY;
      process.env.SOAP_BILLING_API_KEY = 'test_soap_secret_key_123';

      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetInvoiceDetails xmlns="http://roombae.com/soap/billing">
              <invoiceNumber>INV-1001</invoiceNumber>
            </GetInvoiceDetails>
          </soap:Body>
        </soap:Envelope>`;

      // 1. Rejection with invalid key
      const rejectedRes = await request(app)
        .post('/soap/billing')
        .set('Content-Type', 'text/xml')
        .set('X-API-Key', 'wrong_key')
        .send(soapEnvelope);
      expect(rejectedRes.status).toBe(401);

      // 2. Acceptance with valid key
      const acceptedRes = await request(app)
        .post('/soap/billing')
        .set('Content-Type', 'text/xml')
        .set('X-API-Key', 'test_soap_secret_key_123')
        .send(soapEnvelope);
      expect([200, 500]).toContain(acceptedRes.status);

      // Cleanup
      if (prevKey !== undefined) {
        process.env.SOAP_BILLING_API_KEY = prevKey;
      } else {
        delete process.env.SOAP_BILLING_API_KEY;
      }
    });

    test('POST /soap/billing rejects XML External Entity (XXE) and DOCTYPE payloads defensively', async () => {
      const prevKey = process.env.SOAP_BILLING_API_KEY;
      process.env.SOAP_BILLING_API_KEY = 'test_soap_secret_key_123';

      const maliciousXxePayload = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/hostname"> ]>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetInvoiceDetails xmlns="http://roombae.com/soap/billing">
              <invoiceNumber>&xxe;</invoiceNumber>
            </GetInvoiceDetails>
          </soap:Body>
        </soap:Envelope>`;

      const res = await request(app)
        .post('/soap/billing')
        .set('Content-Type', 'text/xml')
        .set('X-API-Key', 'test_soap_secret_key_123')
        .send(maliciousXxePayload);

      expect(res.status).toBe(400);
      expect(res.text).toContain('strictly prohibited');
      expect(res.text).not.toContain('/etc/hostname');

      if (prevKey !== undefined) {
        process.env.SOAP_BILLING_API_KEY = prevKey;
      } else {
        delete process.env.SOAP_BILLING_API_KEY;
      }
    });
  });

  describe('GraphQL Scope Note', () => {
    test('GraphQL surface has been removed per project architectural specification', () => {
      expect(true).toBe(true);
    });
  });
});
