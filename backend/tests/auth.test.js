const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock db
jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  mockDb.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  });
  return mockDb;
});

const db = require('../src/db/connection');
const { register, login, getMe } = require('../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('returns 400 if required fields missing', async () => {
      const req = { body: { email: 'test@test.com' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email, password, and name are required' });
    });

    it('returns 409 if email already registered', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: '123', email: 'test@test.com' }),
      });

      const req = { body: { email: 'test@test.com', password: 'pass', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('creates user and returns token on success', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // no existing user
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'new-id', email: 'new@test.com', name: 'New', tier_status: 'free', role: 'user', sub_end_date: null,
        }]),
      });

      const req = { body: { email: 'new@test.com', password: 'pass123', name: 'New User' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      const call = res.json.mock.calls[0][0];
      expect(call).toHaveProperty('token');
      expect(call).toHaveProperty('user');
    });
  });

  describe('login', () => {
    it('returns 400 if email or password missing', async () => {
      const req = { body: { email: 'test@test.com' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 if user not found', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });

      const req = { body: { email: 'ghost@test.com', password: 'pass' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 if password does not match', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: '1', email: 'u@test.com', password_hash: hash, tier_status: 'free', sub_end_date: null }),
      });

      const req = { body: { email: 'u@test.com', password: 'wrong-pass' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns token on valid credentials', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: '1', email: 'u@test.com', password_hash: hash,
          tier_status: 'premium', sub_end_date: new Date(Date.now() + 99999999),
          role: 'user', name: 'User',
        }),
        update: jest.fn().mockReturnThis(),
      });

      const req = { body: { email: 'u@test.com', password: 'pass123' } };
      const res = mockRes();
      await login(req, res);
      expect(res.json).toHaveBeenCalled();
      const call = res.json.mock.calls[0][0];
      expect(call).toHaveProperty('token');
    });
  });
});
