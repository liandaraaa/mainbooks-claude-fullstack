jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  return mockDb;
});

const db = require('../src/db/connection');
const { subscribe, purchaseBook } = require('../src/controllers/entitlementController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('EntitlementController — Extended', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('subscribe — edge cases', () => {
    it('allows re-subscribe if previous sub is expired', async () => {
      const updateFn = jest.fn().mockResolvedValue(1);
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          tier_status: 'premium',
          sub_end_date: new Date(Date.now() - 99999), // expired
        }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        update: updateFn,
      });

      const req = { user: { id: 'user-1' } };
      const res = mockRes();
      await subscribe(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ tier_status: 'premium' })
      );
    });

    it('allows subscribe if user was free', async () => {
      const updateFn = jest.fn().mockResolvedValue(1);
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        update: updateFn,
      });

      const req = { user: { id: 'user-1' } };
      const res = mockRes();
      await subscribe(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tier_status: 'premium',
          transaction_id: expect.stringContaining('TXN-'),
        })
      );
    });

    it('returns 400 with sub_end_date if already subscribed and valid', async () => {
      const futureDate = new Date(Date.now() + 99999999);
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          tier_status: 'premium',
          sub_end_date: futureDate,
        }),
      });

      const req = { user: { id: 'user-1' } };
      const res = mockRes();
      await subscribe(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Already subscribed', sub_end_date: futureDate })
      );
    });
  });

  describe('purchaseBook — edge cases', () => {
    it('returns 400 for subscription-only book with no otp_price', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'book-1', title: 'Katalog Book', otp_price: null, is_active: true,
        }),
      });

      const req = { body: { book_id: 'book-1' }, user: { id: 'user-1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'This book is not available for individual purchase',
      });
    });

    it('returns transaction_id on successful purchase', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'book-1', title: 'OTP Book', otp_price: 50000, is_active: true,
        }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'e-1', user_id: 'user-1', book_id: 'book-1', access_type: 'PURCHASE',
        }]),
      });

      const req = { body: { book_id: 'book-1' }, user: { id: 'user-1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_id: expect.stringContaining('TXN-'),
          entitlement: expect.objectContaining({ access_type: 'PURCHASE' }),
        })
      );
    });

    it('returns 400 with correct message if book already owned', async () => {
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'book-1', otp_price: 50000, is_active: true }),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'existing-entitlement' }),
      });

      const req = { body: { book_id: 'book-1' }, user: { id: 'user-1' } };
      const res = mockRes();
      await purchaseBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'You already own this book' });
    });
  });
});
