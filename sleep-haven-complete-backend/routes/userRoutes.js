const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  registerPaidUser,
  loginUser, 
  getUserProfile, 
  updateUserProfile 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth'); // Updated path

// Public routes
router.post('/register', registerUser);
router.post('/register-paid-user', registerPaidUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;

