const db = require('../db/connection');

// Mock payment processor
const processPayment = async (amount, method) => {
  // Simulate payment processing delay
  await new Promise((r) => setTimeout(r, 100));
  return { success: true, transaction_id: `TXN-${Date.now()}` };
};

const subscribe = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await db('users').where({ id: userId }).first();
    if (user.tier_status === 'premium') {
      const subValid = user.sub_end_date && new Date(user.sub_end_date) > new Date();
      if (subValid) {
        return res.status(400).json({ error: 'Already subscribed', sub_end_date: user.sub_end_date });
      }
    }

    // Mock payment (Rp 49.000/bulan)
    const payment = await processPayment(49000, 'mock');
    if (!payment.success) {
      return res.status(402).json({ error: 'Payment failed' });
    }

    const subEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db('users').where({ id: userId }).update({
      tier_status: 'premium',
      sub_end_date: subEndDate,
      updated_at: new Date(),
    });

    res.json({
      message: 'Subscription activated successfully',
      tier_status: 'premium',
      sub_end_date: subEndDate,
      transaction_id: payment.transaction_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription failed' });
  }
};

const purchaseBook = async (req, res) => {
  const userId = req.user.id;
  const { book_id } = req.body;

  if (!book_id) return res.status(400).json({ error: 'book_id is required' });

  try {
    const book = await db('books').where({ id: book_id, is_active: true }).first();
    if (!book) return res.status(404).json({ error: 'Book not found or not available' });

    if (!book.otp_price) {
      return res.status(400).json({ error: 'This book is not available for individual purchase' });
    }

    // Check if already owned
    const existing = await db('entitlements').where({ user_id: userId, book_id }).first();
    if (existing) {
      return res.status(400).json({ error: 'You already own this book' });
    }

    // Mock payment
    const payment = await processPayment(book.otp_price, 'mock');
    if (!payment.success) {
      return res.status(402).json({ error: 'Payment failed' });
    }

    const [entitlement] = await db('entitlements')
      .insert({ user_id: userId, book_id, access_type: 'PURCHASE', granted_at: new Date() })
      .returning('*');

    res.status(201).json({
      message: `Successfully purchased "${book.title}"`,
      entitlement,
      transaction_id: payment.transaction_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Purchase failed' });
  }
};

const getMyEntitlements = async (req, res) => {
  try {
    const entitlements = await db('entitlements')
      .where({ user_id: req.user.id })
      .join('books', 'entitlements.book_id', 'books.id')
      .select(
        'entitlements.id',
        'entitlements.access_type',
        'entitlements.granted_at',
        'books.id as book_id',
        'books.title',
        'books.author',
        'books.cover_url',
        'books.genre'
      );

    res.json({ entitlements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entitlements' });
  }
};

module.exports = { subscribe, purchaseBook, getMyEntitlements };
