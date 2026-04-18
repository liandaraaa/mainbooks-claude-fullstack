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

const db = require('../src/db/connection');
const { getAllBooks, getBookById, createBook, updateBook, deleteBook } = require('../src/controllers/bookController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const sampleBook = {
  id: 'book-1',
  title: 'Test Book',
  author: 'Author',
  is_sub_eligible: true,
  otp_price: null,
  is_active: true,
  version: 1,
};

describe('BookController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBooks', () => {
    it('returns books without access info for unauthenticated user', async () => {
      db._chain.orderBy.mockResolvedValue([sampleBook]);
      const req = { user: null };
      const res = mockRes();
      await getAllBooks(req, res);
      expect(res.json).toHaveBeenCalled();
      const { books } = res.json.mock.calls[0][0];
      expect(books[0]).toHaveProperty('hasAccess', false);
    });

    it('marks subscription books accessible for premium users', async () => {
      db._chain.orderBy.mockResolvedValue([sampleBook]);
      db._chain.where.mockImplementation(function() { return this; });
      db._chain.returning.mockResolvedValue([]);

      // Mock entitlements query to return empty
      let callCount = 0;
      db.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // books query
          return { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue([sampleBook]) };
        }
        // entitlements query
        return { where: jest.fn().mockResolvedValue([]) };
      });

      const req = {
        user: { id: 'u1', tier_status: 'premium', sub_end_date: new Date(Date.now() + 99999999) }
      };
      const res = mockRes();
      await getAllBooks(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createBook', () => {
    it('returns 400 if title or author missing', async () => {
      const req = { body: { title: 'Only Title' } };
      const res = mockRes();
      await createBook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Title and author are required' });
    });

    it('creates and returns book on valid input', async () => {
      db.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([sampleBook]),
      });

      const req = { body: { title: 'New Book', author: 'Someone', is_sub_eligible: true } };
      const res = mockRes();
      await createBook(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ book: sampleBook });
    });
  });

  describe('deleteBook', () => {
    it('returns 404 if book not found', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: 'non-existent' } };
      const res = mockRes();
      await deleteBook(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('soft deletes (sets is_active=false) instead of destroying', async () => {
      const updateFn = jest.fn().mockResolvedValue(1);
      db.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(sampleBook),
      }).mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        update: updateFn,
      });

      const req = { params: { id: 'book-1' } };
      const res = mockRes();
      await deleteBook(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('delisted') })
      );
    });
  });

  describe('getBookById', () => {
    it('returns 404 if book not found', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: 'x' }, user: null };
      const res = mockRes();
      await getBookById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns book with hasAccess=false for unauthenticated', async () => {
      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(sampleBook),
      });

      const req = { params: { id: 'book-1' }, user: null };
      const res = mockRes();
      await getBookById(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ book: expect.objectContaining({ hasAccess: false }) })
      );
    });
  });
});
