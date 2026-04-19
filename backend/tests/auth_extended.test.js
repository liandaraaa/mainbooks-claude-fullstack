const bcrypt = require('bcryptjs');

jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  return mockDb;
});

process.env.JWT_SECRET = 'test-secret';

const db = require('../src/db/connection');
const { register, login, getMe } = require('../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('AuthController — coverage boost', () => {

  describe('register — error branches', () => {
    it('returns 500 on db error during insert', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // no existing user
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('DB insert error')),
      });

      const req = { body: { email: 'new@test.com', password: 'pass123', name: 'New' } };
      const res = mockRes();
      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
    });

    it('returns 500 on db error during duplicate check', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const req = { body: { email: 'new@test.com', password: 'pass123', name: 'New' } };
      const res = mockRes();
      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
    });
  });

  describe('login — error branches', () => {
    it('returns 500 on db error', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const req = { body: { email: 'u@test.com', password: 'pass' } };
      const res = mockRes();
      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Login failed' });
    });

    it('downgrades expired premium user to free on login', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      const updateFn = jest.fn().mockResolvedValue(1);

      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@test.com',
          password_hash: hash,
          tier_status: 'premium',
          sub_end_date: new Date(Date.now() - 99999), // expired
          role: 'user',
          name: 'User',
        }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        update: updateFn,
      });

      const req = { body: { email: 'u@test.com', password: 'pass123' } };
      const res = mockRes();
      await login(req, res);

      expect(updateFn).toHaveBeenCalledWith({ tier_status: 'free' });
      expect(res.json).toHaveBeenCalled();
      const call = res.json.mock.calls[0][0];
      expect(call.user.tier_status).toBe('free');
    });
  });

  describe('getMe — error branches', () => {
    it('returns 500 on db error', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const req = { user: { id: 'u1' } };
      const res = mockRes();
      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch user' });
    });

    it('returns 404 if user not found in db', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });

      const req = { user: { id: 'non-existent' } };
      const res = mockRes();
      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns user data on success', async () => {
      const userData = { id: 'u1', email: 'u@test.com', name: 'User', tier_status: 'free', role: 'user', sub_end_date: null };
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(userData),
      });

      const req = { user: { id: 'u1' } };
      const res = mockRes();
      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: userData });
    });
  });
});
