import {
  generateCsrfToken,
  validateCsrf,
  createSignedCsrfToken,
  verifyCsrfTokenSignature,
  safeCompareCsrf,
} from '../../middleware/csrfMiddleware';

describe('CSRF Double Submit Cookie Middleware', () => {
  test('generateCsrfToken sets cookie and header if missing', () => {
    const req: any = { cookies: {} };
    const res: any = {
      cookie: jest.fn(),
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    generateCsrfToken(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith('csrf-token', expect.any(String), expect.any(Object));
    expect(res.setHeader).toHaveBeenCalledWith('x-csrf-token', expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  test('validateCsrf passes safe methods (GET, HEAD, OPTIONS)', () => {
    const req: any = { method: 'GET' };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validateCsrf REJECTS POST to /api/v1/auth/refresh-token (no longer exempt)', () => {
    // After Section 1 fix: /refresh-token is state-changing + cookie-authenticated,
    // so it must validate CSRF like any other protected endpoint.
    const req: any = {
      method: 'POST',
      path: '/api/v1/auth/refresh-token',
      originalUrl: '/api/v1/auth/refresh-token',
      cookies: { 'csrf-token': 'valid_token_123456789012345678901234' },
      headers: {}, // no x-csrf-token header
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('validateCsrf passes exempt paths (e.g. /api/v1/auth/google/callback)', () => {
    const req: any = { method: 'POST', path: '/api/v1/auth/google/callback', originalUrl: '/api/v1/auth/google/callback' };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validateCsrf rejects POST when CSRF header is missing', () => {
    const req: any = {
      method: 'POST',
      path: '/api/v1/properties',
      cookies: { 'csrf-token': 'valid_token_123456789012345678901234' },
      headers: {},
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('validateCsrf accepts matching cookie and header', () => {
    const token = createSignedCsrfToken();
    const req: any = {
      method: 'POST',
      path: '/api/v1/properties',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validateCsrf rejects tampered HMAC signature', () => {
    const validToken = createSignedCsrfToken();
    const [raw] = validToken.split('.');
    const forgedToken = `${raw}.0000000000000000000000000000000000000000000000000000000000000000`;
    const req: any = {
      method: 'POST',
      path: '/api/v1/properties',
      cookies: { 'csrf-token': forgedToken },
      headers: { 'x-csrf-token': forgedToken },
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('validateCsrf rejects unsigned plain string tokens even if cookie matches header', () => {
    const plainToken = 'raw_unsigned_token_12345678901234567890';
    const req: any = {
      method: 'POST',
      path: '/api/v1/properties',
      cookies: { 'csrf-token': plainToken },
      headers: { 'x-csrf-token': plainToken },
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateCsrf(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyCsrfTokenSignature validates genuine signed tokens and rejects invalid formats', () => {
    const valid = createSignedCsrfToken();
    expect(verifyCsrfTokenSignature(valid)).toBe(true);

    expect(verifyCsrfTokenSignature('')).toBe(false);
    expect(verifyCsrfTokenSignature('unsigned_string_without_dot')).toBe(false);
    expect(verifyCsrfTokenSignature('foo.bar.baz')).toBe(false);
    expect(verifyCsrfTokenSignature('valid_token_123456789012345678901234')).toBe(false);
  });

  test('safeCompareCsrf handles null, undefined, mismatched lengths, and exact matches crash-proof', () => {
    expect(safeCompareCsrf(null, 'token')).toBe(false);
    expect(safeCompareCsrf('token', null)).toBe(false);
    expect(safeCompareCsrf(undefined, undefined)).toBe(false);
    expect(safeCompareCsrf('', '')).toBe(false);
    expect(safeCompareCsrf('short', 'longer_token')).toBe(false);
    expect(safeCompareCsrf('same_length_1', 'same_length_2')).toBe(false);
    expect(safeCompareCsrf('exact_match_token_12345', 'exact_match_token_12345')).toBe(true);
  });
});


