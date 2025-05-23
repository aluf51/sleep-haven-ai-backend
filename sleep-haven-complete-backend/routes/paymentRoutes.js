const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Updated path
const { 
  createCheckoutSession, 
  verifyPayment,
  createGuestCheckoutSession
} = require('../controllers/paymentController');

// Protected routes (require authentication)
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/verify-payment/:sessionId', protect, verifyPayment);

// Public route for guest checkout (no authentication required)
router.post('/guest-checkout', createGuestCheckoutSession);

module.exports = router;
