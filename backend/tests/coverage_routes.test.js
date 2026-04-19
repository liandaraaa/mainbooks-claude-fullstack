const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  return mockDb;
});

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const db = require('../src/db/connection');

const makeToken = (payload) => jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
const adminToken = makeToken({ id: 'admin-1', email: 'admin@test.com', role: 'admin', tier_status: 'premium' });
const userToken = makeToken({ id: 'user-1', email: 'user@test.com', role: 'user', tier_status: 'free' });

beforeEach(() => jest.clearAllMocks());

// ─── Error handler middleware (app.js line 30-31) ─────────────────────────────
describe('Express error handler', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/definitely-not-a-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });
});

// ─── optionalAuth in books.js route (lines 10-12) ────────────────────────────
describe('GET /api/books — optionalAuth branch', () => {
  it('attaches user access info when valid token provided', async () => {
    // getAllBooks with auth: books + dbUser + entitlements
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
    }).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.books).toBeInstanceOf(Array);
  });

  it('ignores invalid token in optionalAuth — continues as unauthenticated', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(200);
    expect(res.body.books).toBeInstanceOf(Array);
  });

  it('attaches user for GET /api/books/:id with valid token', async () => {
    const book = {
      id: 'book-1', title: 'Book', author: 'A', is_sub_eligible: true,
      otp_price: null, is_active: true, version: 1,
    };

    // getBookById: book query + checkAccess: book query + entitlement query
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(book),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(book),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get('/api/books/book-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.book).toHaveProperty('hasAccess');
  });

  it('ignores invalid token for GET /api/books/:id', async () => {
    const book = {
      id: 'book-1', title: 'Book', author: 'A', is_sub_eligible: true,
      otp_price: null, is_active: true, version: 1,
    };

    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(book),
    });

    const res = await request(app)
      .get('/api/books/book-1')
      .set('Authorization', 'Bearer bad.token');

    expect(res.status).toBe(200);
    expect(res.body.book.hasAccess).toBe(false);
  });
});

// ─── entitlementController — getMyEntitlements error ─────────────────────────
describe('GET /api/entitlements/my — error branch', () => {
  it('returns 500 on db error', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const res = await request(app)
      .get('/api/entitlements/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch entitlements');
  });
});

// ─── middleware auth.js line 11 — missing Bearer prefix handled ───────────────
describe('Auth middleware — branch coverage', () => {
  it('returns 401 for token with no Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Token abc123');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
});
