const express = require('express');
const router = express.Router();
const { subscribe, purchaseBook, getMyEntitlements } = require('../controllers/entitlementController');
const { authenticate } = require('../middleware/auth');

router.post('/subscribe', authenticate, subscribe);
router.post('/purchase', authenticate, purchaseBook);
router.get('/my', authenticate, getMyEntitlements);

module.exports = router;
