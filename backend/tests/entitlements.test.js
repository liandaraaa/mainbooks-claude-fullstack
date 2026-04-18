jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  return mockDb;
});

const db = require('../src/db/connection');
const { subscribe, purchaseBook, getMyEntitlements } = require('../src/controllers/entitlementController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('EntitlementController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('subscribe', () => {
    it('returns 400 if already subscribed with valid sub', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          tier_status: 'premium',
          sub_end_date: new Date(Date.now() + 999999),
        }),
      });

      const req = { user: { id: 'u1' } };
      const res = mockRes();
      await subscribe(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Already subscribed' })
      );
    });

    it('activates subscription for free user', async () => {
      const updateFn = jest.fn().mockResolvedValue(1);
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        update: updateFn,
      });

      const req = { user: { id: 'u1' } };
      const res = mockRes();
      await subscribe(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ tier_status: 'premium' })
      );
    });
  });

  describe('purchaseBook', () => {
    it('returns 400 if book_id missing', async () => {
      const req = { body: {}, user: { id: 'u1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'book_id is required' });
    });

    it('returns 404 if book not found', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });

      const req = { body: { book_id: 'bad-id' }, user: { id: 'u1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 if book is not purchasable (no otp_price)', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'b1', otp_price: null, is_active: true }),
      });

      const req = { body: { book_id: 'b1' }, user: { id: 'u1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'This book is not available for individual purchase' });
    });

    it('returns 400 if user already owns the book', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'b1', otp_price: 50000, is_active: true, title: 'Book' }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'e1' }), // already has entitlement
      });

      const req = { body: { book_id: 'b1' }, user: { id: 'u1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'You already own this book' });
    });

    it('creates entitlement on successful purchase', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'b1', otp_price: 50000, is_active: true, title: 'Test Book' }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // no existing entitlement
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'e1', user_id: 'u1', book_id: 'b1', access_type: 'PURCHASE' }]),
      });

      const req = { body: { book_id: 'b1' }, user: { id: 'u1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      const call = res.json.mock.calls[0][0];
      expect(call).toHaveProperty('entitlement');
      expect(call).toHaveProperty('transaction_id');
    });
  });

  describe('getMyEntitlements', () => {
    it('returns user entitlements with book details', async () => {
      const mockEntitlements = [
        { id: 'e1', book_id: 'b1', title: 'Book 1', access_type: 'PURCHASE' }
      ];
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockEntitlements),
      });

      const req = { user: { id: 'u1' } };
      const res = mockRes();
      await getMyEntitlements(req, res);
      expect(res.json).toHaveBeenCalledWith({ entitlements: mockEntitlements });
    });
  });
});
