const express = require('express');
const router = express.Router();
const { 
  createSleepPlan, 
  getSleepPlan, 
  getUserSleepPlans, 
  updateSleepPlan 
} = require('../controllers/sleepPlanController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/', protect, createSleepPlan);
router.get('/:id', protect, getSleepPlan);
router.get('/user/:userId', protect, getUserSleepPlans);
router.put('/:id', protect, updateSleepPlan);

module.exports = router;
