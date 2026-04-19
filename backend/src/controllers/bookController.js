const db = require('../db/connection');

// Check if user has access to a book
const checkAccess = async (userId, bookId, tierStatus, subEndDate) => {
  const book = await db('books').where({ id: bookId }).first();
  if (!book) return { hasAccess: false, reason: 'book_not_found' };

  // ← cek OTP dulu sebelum cek is_active
  // grandfathered access: kalau sudah beli, tetap bisa akses walau delist
  const entitlement = await db('entitlements')
    .where({ user_id: userId, book_id: bookId })
    .first();
  if (entitlement) return { hasAccess: true, reason: 'purchased' };

  // ← baru cek is_active untuk non-OTP
  if (!book.is_active) return { hasAccess: false, reason: 'book_not_found' };

  // Check subscription
  if (book.is_sub_eligible && tierStatus === 'premium') {
    const subValid = subEndDate && new Date(subEndDate) > new Date();
    if (subValid) return { hasAccess: true, reason: 'subscription' };
  }

  return { hasAccess: false, reason: book.is_sub_eligible ? 'requires_subscription' : 'requires_purchase' };
};

const getAllBooks = async (req, res) => {
  try {
    const books = await db('books').where({ is_active: true }).orderBy('created_at', 'desc');

    if (req.user) {
      const dbUser = await db('users').where({ id: req.user.id }).first();
      const { tier_status, sub_end_date } = dbUser;

      const entitlements = await db('entitlements').where({ user_id: req.user.id });
      const purchasedIds = new Set(entitlements.map((e) => e.book_id));

      const booksWithAccess = books.map((book) => {
        let hasAccess = false;
        let accessReason = null;

        if (purchasedIds.has(book.id)) {
          hasAccess = true;
          accessReason = 'purchased';
        } else if (book.is_sub_eligible && tier_status === 'premium') {
          const subValid = sub_end_date && new Date(sub_end_date) > new Date();
          if (subValid) { hasAccess = true; accessReason = 'subscription'; }
        }

        return { ...book, hasAccess, accessReason };
      });

      return res.json({ books: booksWithAccess });
    }

    res.json({ books: books.map((b) => ({ ...b, hasAccess: false })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

const getBookById = async (req, res) => {
  try {
    // ← hapus filter is_active
    const book = await db('books').where({ id: req.params.id }).first();
    if (!book) return res.status(404).json({ error: 'Book not found' });

    let hasAccess = false;
    let accessReason = null;

    if (req.user) {
      const dbUser = await db('users').where({ id: req.user.id }).first();
      const result = await checkAccess(req.user.id, book.id, dbUser.tier_status, dbUser.sub_end_date);
      hasAccess = result.hasAccess;
      accessReason = result.reason;
    }

    // ← buku delist + tidak punya akses → 404
    // ← buku delist + punya OTP → tetap bisa akses (grandfathered)
    if (!book.is_active && !hasAccess) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: { ...book, hasAccess, accessReason } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

const createBook = async (req, res) => {
  const { title, author, description, cover_url, genre, pages, language, is_sub_eligible, otp_price } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  try {
    const [book] = await db('books')
      .insert({
        title, author, description, cover_url, genre,
        pages: pages || null,
        language: language || 'id',
        is_sub_eligible: is_sub_eligible !== undefined ? is_sub_eligible : true,
        otp_price: otp_price || null,
        is_active: true,
        version: 1,
      })
      .returning('*');

    res.status(201).json({ book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

const updateBook = async (req, res) => {
  const { title, author, description, cover_url, genre, pages, language, is_sub_eligible, otp_price, is_active } = req.body;

  try {
    const existing = await db('books').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    const [book] = await db('books')
      .where({ id: req.params.id })
      .update({
        title: title || existing.title,
        author: author || existing.author,
        description: description !== undefined ? description : existing.description,
        cover_url: cover_url !== undefined ? cover_url : existing.cover_url,
        genre: genre !== undefined ? genre : existing.genre,
        pages: pages !== undefined ? pages : existing.pages,
        language: language || existing.language,
        is_sub_eligible: is_sub_eligible !== undefined ? is_sub_eligible : existing.is_sub_eligible,
        otp_price: otp_price !== undefined ? otp_price : existing.otp_price,
        is_active: is_active !== undefined ? is_active : existing.is_active,
        version: existing.version + 1,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const existing = await db('books').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    // Soft delete - delist, not destroy (grandfathered access preserved via entitlements)
    await db('books').where({ id: req.params.id }).update({ is_active: false, updated_at: new Date() });

    res.json({ message: 'Book delisted successfully. Existing purchasers retain access.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook, checkAccess };
