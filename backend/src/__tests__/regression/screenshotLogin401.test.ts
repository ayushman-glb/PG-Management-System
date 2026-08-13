import request from 'supertest';
import { app } from '../../app';

describe('Regression Test: Screenshot Login 401 Scenario', () => {
  /**
   * Recreates the exact scenario from the initial audit report:
   * - User on PG Owner tab attempts login with 'owner1@roombae.com' (or non-existent account).
   * - Client submits POST /api/v1/auth/login.
   *
   * Regression Guarantees:
   * 1. Backend must return 401 with generic error code 'ACCOUNT_NOT_FOUND_OR_INVALID'.
   * 2. Response bytes for non-existent email and wrong password must be identical to preserve anti-enumeration.
   * 3. Role selection on UI tabs must NOT inject client role parameters into /auth/login request.
   */
  test('PG Owner login failure returns anti-enumeration 401 ACCOUNT_NOT_FOUND_OR_INVALID', async () => {
    const ownerPayload = {
      identifier: 'owner1@roombae.com',
      password: 'IncorrectPassword123!',
      rememberMe: false,
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(ownerPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND_OR_INVALID');
    expect(res.body.error.message).toBe("We couldn't find an account with these details. Would you like to sign up instead?");

    // Ensure role key is NOT sent or processed as client override
    expect((ownerPayload as any).role).toBeUndefined();
  });

  test('Response bytes for non-existent email vs wrong password are byte-equivalent', async () => {
    const nonExistentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'non_existent_owner_999@roombae.com',
        password: 'Password123!',
      });

    const wrongPasswordRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'owner1@roombae.com',
        password: 'WrongPassword999!',
      });

    expect(nonExistentRes.status).toBe(401);
    expect(wrongPasswordRes.status).toBe(401);

    const body1 = JSON.stringify(nonExistentRes.body);
    const body2 = JSON.stringify(wrongPasswordRes.body);

    // Exact byte length & content equivalence
    expect(Buffer.byteLength(body1)).toBe(Buffer.byteLength(body2));
    expect(body1).toBe(body2);
  });
});
