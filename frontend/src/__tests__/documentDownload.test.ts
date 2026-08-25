import { describe, it, expect } from 'vitest';
import { getDocumentUrl } from '../hooks/useDocumentDownload';
import { env } from '../config/env';

describe('Document Download Hook & Route Contract', () => {
  it('should map INVOICE to /billing/invoices/:id/pdf', () => {
    const url = getDocumentUrl('INVOICE', 'inv_123');
    expect(url).toBe(`${env.API_URL}/billing/invoices/inv_123/pdf`);
  });

  it('should map PAYMENT_RECEIPT to /payments/:id/receipt', () => {
    const url = getDocumentUrl('PAYMENT_RECEIPT', 'pay_456');
    expect(url).toBe(`${env.API_URL}/payments/pay_456/receipt`);
  });

  it('should map RENT_RECEIPT to /payments/:id/receipt', () => {
    const url = getDocumentUrl('RENT_RECEIPT', 'pay_456');
    expect(url).toBe(`${env.API_URL}/payments/pay_456/receipt`);
  });

  it('should map TRANSACTION_RECEIPT to /payments/:id/receipt', () => {
    const url = getDocumentUrl('TRANSACTION_RECEIPT', 'pay_456');
    expect(url).toBe(`${env.API_URL}/payments/pay_456/receipt`);
  });

  it('should map SECURITY_DEPOSIT_RECEIPT to /payments/:id/receipt', () => {
    const url = getDocumentUrl('SECURITY_DEPOSIT_RECEIPT', 'pay_456');
    expect(url).toBe(`${env.API_URL}/payments/pay_456/receipt`);
  });

  it('should map REFUND_RECEIPT to /payments/:id/receipt', () => {
    const url = getDocumentUrl('REFUND_RECEIPT', 'pay_456');
    expect(url).toBe(`${env.API_URL}/payments/pay_456/receipt`);
  });

  it('should map LEASE_AGREEMENT to /agreements/:id/pdf', () => {
    const url = getDocumentUrl('LEASE_AGREEMENT', 'agr_789');
    expect(url).toBe(`${env.API_URL}/agreements/agr_789/pdf`);
  });

  it('should map SIGNED_AGREEMENT to /agreements/:id/pdf', () => {
    const url = getDocumentUrl('SIGNED_AGREEMENT', 'agr_789');
    expect(url).toBe(`${env.API_URL}/agreements/agr_789/pdf`);
  });

  it('should map DIGITAL_AGREEMENT to /agreements/:id/pdf', () => {
    const url = getDocumentUrl('DIGITAL_AGREEMENT', 'agr_789');
    expect(url).toBe(`${env.API_URL}/agreements/agr_789/pdf`);
  });
});
