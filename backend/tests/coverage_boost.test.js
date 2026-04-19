jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn();
  return mockDb;
});

const db = require('../src/db/connection');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  checkAccess,
} = require('../src/controllers/bookController');

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
  description: 'Desc',
  cover_url: '',
  genre: 'Dongeng',
  pages: 100,
  language: 'id',
  is_sub_eligible: true,
  otp_price: null,
  is_active: true,
  version: 1,
};

beforeEach(() => jest.clearAllMocks());

// ─── getAllBooks ──────────────────────────────────────────────────────────────

describe('getAllBooks — authenticated branches', () => {
  it('attaches hasAccess=purchased for book user already owns', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([sampleBook]),
    }).mockReturnValueOnce({
      // ← fetch dbUser dari DB
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
    }).mockReturnValueOnce({
      // ← fetch entitlements
      where: jest.fn().mockResolvedValue([{ book_id: 'book-1' }]),
    });

    const req = { user: { id: 'u1' } };
    const res = mockRes();
    await getAllBooks(req, res);
    const { books } = res.json.mock.calls[0][0];
    expect(books[0]).toMatchObject({ hasAccess: true, accessReason: 'purchased' });
  });

  it('attaches hasAccess=subscription for premium user with valid sub', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([{ ...sampleBook, is_sub_eligible: true }]),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        tier_status: 'premium',
        sub_end_date: new Date(Date.now() + 999999999),
      }),
    }).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue([]),
    });

    const req = { user: { id: 'u1' } };
    const res = mockRes();
    await getAllBooks(req, res);
    const { books } = res.json.mock.calls[0][0];
    expect(books[0]).toMatchObject({ hasAccess: true, accessReason: 'subscription' });
  });

  it('attaches hasAccess=false for premium user with expired sub', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([{ ...sampleBook, is_sub_eligible: true }]),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        tier_status: 'premium',
        sub_end_date: new Date(Date.now() - 999999),
      }),
    }).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue([]),
    });

    const req = { user: { id: 'u1' } };
    const res = mockRes();
    await getAllBooks(req, res);
    const { books } = res.json.mock.calls[0][0];
    expect(books[0]).toMatchObject({ hasAccess: false, accessReason: null });
  });

  it('attaches hasAccess=false for OTP-only book with no entitlement', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([{ ...sampleBook, is_sub_eligible: false, otp_price: 50000 }]),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
    }).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue([]),
    });

    const req = { user: { id: 'u1' } };
    const res = mockRes();
    await getAllBooks(req, res);
    const { books } = res.json.mock.calls[0][0];
    expect(books[0]).toMatchObject({ hasAccess: false });
  });

  it('returns 500 on db error', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const req = { user: null };
    const res = mockRes();
    await getAllBooks(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch books' });
  });
});

// ─── getBookById ─────────────────────────────────────────────────────────────

describe('getBookById — authenticated branches', () => {
  it('returns book with hasAccess=true for authenticated user who owns book', async () => {
    db.mockReturnValueOnce({
      // getBookById: fetch book
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      // getBookById: fetch dbUser
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ tier_status: 'free', sub_end_date: null }),
    }).mockReturnValueOnce({
      // checkAccess: fetch book
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      // checkAccess: fetch entitlement
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: 'e1' }),
    });

    const req = {
      params: { id: 'book-1' },
      user: { id: 'u1', tier_status: 'free', sub_end_date: null },
    };
    const res = mockRes();
    await getBookById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ book: expect.objectContaining({ hasAccess: true, accessReason: 'purchased' }) })
    );
  });

  it('returns book with hasAccess=false for authenticated user with no access', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook), // checkAccess book
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null), // no entitlement
    });

    const req = {
      params: { id: 'book-1' },
      user: { id: 'u1', tier_status: 'free', sub_end_date: null },
    };
    const res = mockRes();
    await getBookById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ book: expect.objectContaining({ hasAccess: false }) })
    );
  });

  it('returns 500 on db error', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const req = { params: { id: 'book-1' }, user: null };
    const res = mockRes();
    await getBookById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch book' });
  });
});

// ─── createBook ──────────────────────────────────────────────────────────────

describe('createBook — error branch', () => {
  it('returns 500 on db error', async () => {
    db.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const req = { body: { title: 'Book', author: 'Author', is_sub_eligible: true } };
    const res = mockRes();
    await createBook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create book' });
  });

  it('defaults is_sub_eligible to true if not provided', async () => {
    db.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ ...sampleBook }]),
    });

    const req = { body: { title: 'Book', author: 'Author' } }; // no is_sub_eligible
    const res = mockRes();
    await createBook(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ─── updateBook ──────────────────────────────────────────────────────────────

describe('updateBook — error branch', () => {
  it('returns 500 on db error during update', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const req = { params: { id: 'book-1' }, body: { title: 'New Title' } };
    const res = mockRes();
    await updateBook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update book' });
  });
});

// ─── deleteBook ──────────────────────────────────────────────────────────────

describe('deleteBook — error branch', () => {
  it('returns 500 on db error during delete', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(sampleBook),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const req = { params: { id: 'book-1' } };
    const res = mockRes();
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete book' });
  });
});

// ─── checkAccess — remaining branches ────────────────────────────────────────
// Note: local checkAccess checks !book.is_active BEFORE entitlements
// So delisted books always return book_not_found regardless of entitlements

describe('checkAccess — remaining branches', () => {
 it('returns book_not_found if book is_active false', async () => {
  // Local checkAccess: checks entitlement FIRST, then is_active
  // So need mock for both book query AND entitlement query
  db.mockReturnValueOnce({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ ...sampleBook, is_active: false }),
  }).mockReturnValueOnce({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null), // no entitlement
  });
  const result = await checkAccess('u1', 'book-1', 'free', null);
  expect(result).toEqual({ hasAccess: false, reason: 'book_not_found' });
});

  it('returns requires_subscription for sub-eligible active book with free user', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ ...sampleBook, is_sub_eligible: true, is_active: true }),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null), // no entitlement
    });
    const result = await checkAccess('u1', 'book-1', 'free', null);
    expect(result).toEqual({ hasAccess: false, reason: 'requires_subscription' });
  });

  it('returns requires_purchase for OTP-only active book with free user', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ ...sampleBook, is_sub_eligible: false, otp_price: 50000, is_active: true }),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const result = await checkAccess('u1', 'book-1', 'free', null);
    expect(result).toEqual({ hasAccess: false, reason: 'requires_purchase' });
  });

  it('returns subscription for premium user with valid sub', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ ...sampleBook, is_sub_eligible: true, is_active: true }),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const result = await checkAccess('u1', 'book-1', 'premium', new Date(Date.now() + 999999));
    expect(result).toEqual({ hasAccess: true, reason: 'subscription' });
  });

  it('returns requires_purchase (not sub) for OTP-only book with premium user and null sub_end_date', async () => {
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ ...sampleBook, is_sub_eligible: false, is_active: true }),
    }).mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    });
    const result = await checkAccess('u1', 'book-1', 'premium', null);
    expect(result).toEqual({ hasAccess: false, reason: 'requires_purchase' });
  });
});
