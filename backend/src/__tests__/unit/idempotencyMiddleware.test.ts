import { idempotencyMiddleware } from '../../middleware/idempotencyMiddleware';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    idempotencyRequest: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'idem_123' }),
    },
  },
}));

describe('IdempotencyMiddleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'POST',
      headers: {},
      originalUrl: '/api/v1/payments/rent',
      user: { id: 'usr_idem_1' },
    };
    res = {
      statusCode: 200,
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('should pass through if no Idempotency-Key header is provided', async () => {
    await idempotencyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(prisma.idempotencyRequest.findUnique).not.toHaveBeenCalled();
  });

  test('should return cached response on idempotency hit', async () => {
    req.headers['idempotency-key'] = 'idem-unique-key-12345';
    (prisma.idempotencyRequest.findUnique as jest.Mock).mockResolvedValue({
      id: 'idem_1',
      key: 'idem-unique-key-12345',
      statusCode: 201,
      response: { success: true, message: 'Payment already processed' },
    });

    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-Idempotency-Hit', 'true');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Payment already processed' });
  });

  test('should call next and capture response on new idempotency key', async () => {
    req.headers['idempotency-key'] = 'idem-unique-key-99999';
    (prisma.idempotencyRequest.findUnique as jest.Mock).mockResolvedValue(null);

    await idempotencyMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(prisma.idempotencyRequest.findUnique).toHaveBeenCalledWith({
      where: { key: 'idem-unique-key-99999' },
    });
  });
});
