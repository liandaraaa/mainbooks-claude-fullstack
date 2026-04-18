const express = require('express');
const router = express.Router();
const { getAllBooks, getBookById, createBook, updateBook, deleteBook } = require('../controllers/bookController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Optional auth - attaches access info if logged in
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'mainbooks-secret');
    } catch (_) {}
  }
  next();
};

router.get('/', optionalAuth, getAllBooks);
router.get('/:id', optionalAuth, getBookById);

// Admin only - CRUD
router.post('/', authenticate, requireAdmin, createBook);
router.put('/:id', authenticate, requireAdmin, updateBook);
router.delete('/:id', authenticate, requireAdmin, deleteBook);

module.exports = router;
