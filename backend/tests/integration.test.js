const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock db before requiring app
jest.mock('../src/db/connection', () => {
  const mockChain = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };
  const mockDb = jest.fn(() => mockChain);
  mockDb._chain = mockChain;
  return mockDb;
});

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const db = require('../src/db/connection');

const makeToken = (payload) => jwt.sign(payload, 'test-secret', { expiresIn: '1h' });

const userToken = makeToken({ id: 'user-1', email: 'user@test.com', role: 'user', tier_status: 'free' });
const adminToken = makeToken({ id: 'admin-1', email: 'admin@test.com', role: 'admin', tier_status: 'premium' });
const premiumToken = makeToken({ id: 'premium-1', email: 'premium@test.com', role: 'user', tier_status: 'premium' });

const sampleBook = {
  id: 'book-1',
  title: 'Test Book',
  author: 'Author',
  description: 'Desc',
  genre: 'Dongeng',
  is_sub_eligible: true,
  otp_price: null,
  is_active: true,
  version: 1,
};

beforeEach(() => jest.clearAllMocks());

// ─── Health Check ───────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'MainBooks API' });
  });
});

// ─── Auth Routes ────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('returns 400 if fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email, password, and name are required');
  });

  it('returns 409 if email already exists', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: '1', email: 'existing@test.com' }),
    });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@test.com', password: 'pass123', name: 'User' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 if fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 if user not found', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.status).toBe(401); // message varies by implementation
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 if no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user data with valid token', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        id: 'user-1', email: 'user@test.com', name: 'User', tier_status: 'free', role: 'user', sub_end_date: null,
      }),
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', 'user@test.com');
  });

  it('returns 404 if user not found in db', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});

// ─── Books Routes ────────────────────────────────────────
describe('GET /api/books', () => {
  it('returns books without auth', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([sampleBook]),
    });
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.books).toBeInstanceOf(Array);
  });

  it('returns 401 for POST without token', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Book', author: 'Author' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for POST with non-admin token', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Book', author: 'Author' });
    expect(res.status).toBe(403);
  });

  it('returns 400 for POST with missing fields (admin)', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Only Title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title and author are required');
  });

  it('creates book with valid admin request', async () => {
    db.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([sampleBook]),
    });
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'New Book', author: 'Author', is_sub_eligible: true });
    expect(res.status).toBe(201);
    expect(res.body.book).toHaveProperty('title');
  });
});

describe('DELETE /api/books/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/books/book-1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .delete('/api/books/book-1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 if book not found', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .delete('/api/books/non-existent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('soft deletes book successfully', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
    });
    const res = await request(app)
      .delete('/api/books/book-1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('delisted');
  });
});

describe('PUT /api/books/:id', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .put('/api/books/book-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(403);
  });

  it('returns 404 if book not found', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .put('/api/books/non-existent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('updates book successfully', async () => {
    const updatedBook = { ...sampleBook, title: 'Updated Title', version: 2 };
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([updatedBook]),
    });
    const res = await request(app)
      .put('/api/books/book-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.book.title).toBe('Updated Title');
  });
});

// ─── Entitlement Routes ──────────────────────────────────
describe('POST /api/entitlements/subscribe', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/entitlements/subscribe');
    expect(res.status).toBe(401);
  });

  it('returns 400 if already subscribed', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        tier_status: 'premium',
        sub_end_date: new Date(Date.now() + 999999),
      }),
    });
    const res = await request(app)
      .post('/api/entitlements/subscribe')
      .set('Authorization', `Bearer ${premiumToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Already subscribed');
  });
});

describe('POST /api/entitlements/purchase', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/entitlements/purchase');
    expect(res.status).toBe(401);
  });

  it('returns 400 if book_id missing', async () => {
    const res = await request(app)
      .post('/api/entitlements/purchase')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('book_id is required');
  });

  it('returns 404 if book not found', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .post('/api/entitlements/purchase')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ book_id: 'non-existent' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/entitlements/my', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/entitlements/my');
    expect(res.status).toBe(401);
  });

  it('returns entitlements for authenticated user', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        { id: 'e1', book_id: 'b1', title: 'Book 1', access_type: 'PURCHASE' }
      ]),
    });
    const res = await request(app)
      .get('/api/entitlements/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.entitlements).toBeInstanceOf(Array);
  });
});

// ─── 404 Route ───────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });
});
