const express = require('express');
const router = express.Router();
const { createCheckoutSession, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/verify-payment/:sessionId', protect, verifyPayment);

module.exports = router;
