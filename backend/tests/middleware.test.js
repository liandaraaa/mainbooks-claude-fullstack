const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('../src/middleware/auth');

process.env.JWT_SECRET = 'test-secret';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeToken = (payload) =>
  jwt.sign(payload, 'test-secret', { expiresIn: '1h' });

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('returns 401 if no authorization header', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if authorization header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic abc123' } };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if token is invalid', () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if token is expired', () => {
      const token = jwt.sign({ id: '1', role: 'user' }, 'test-secret', { expiresIn: '-1s' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next and sets req.user on valid token', () => {
      const payload = { id: 'user-1', email: 'test@test.com', role: 'user' };
      const token = makeToken(payload);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toMatchObject({ id: 'user-1', role: 'user' });
    });

    it('returns 401 if token signed with wrong secret', () => {
      const token = jwt.sign({ id: '1' }, 'wrong-secret');
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAdmin', () => {
    it('returns 403 if user is not admin', () => {
      const req = { user: { id: '1', role: 'user' } };
      const res = mockRes();
      const next = jest.fn();
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if user is admin', () => {
      const req = { user: { id: '1', role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();
      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
