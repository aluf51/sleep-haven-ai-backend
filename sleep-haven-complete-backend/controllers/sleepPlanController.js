const SleepPlan = require('../models/SleepPlan');

// @desc    Create a new sleep plan
// @route   POST /api/sleep-plans
// @access  Private
exports.createSleepPlan = async (req, res) => {
  try {
    // Add user ID to sleep plan data
    req.body.userId = req.user.id;
    
    // Create sleep plan
    const sleepPlan = await SleepPlan.create(req.body);

    res.status(201).json({
      status: 'success',
      data: sleepPlan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get sleep plan by ID
// @route   GET /api/sleep-plans/:id
// @access  Private
exports.getSleepPlan = async (req, res) => {
  try {
    const sleepPlan = await SleepPlan.findById(req.params.id);

    if (!sleepPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Sleep plan not found'
      });
    }

    // Make sure user owns the sleep plan
    if (sleepPlan.userId.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this sleep plan'
      });
    }

    res.status(200).json({
      status: 'success',
      data: sleepPlan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all sleep plans for a user
// @route   GET /api/sleep-plans/user/:userId
// @access  Private
exports.getUserSleepPlans = async (req, res) => {
  try {
    // Make sure user is accessing their own sleep plans
    if (req.params.userId !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access these sleep plans'
      });
    }

    const sleepPlans = await SleepPlan.find({ userId: req.params.userId });

    res.status(200).json({
      status: 'success',
      data: sleepPlans
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update sleep plan
// @route   PUT /api/sleep-plans/:id
// @access  Private
exports.updateSleepPlan = async (req, res) => {
  try {
    let sleepPlan = await SleepPlan.findById(req.params.id);

    if (!sleepPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Sleep plan not found'
      });
    }

    // Make sure user owns the sleep plan
    if (sleepPlan.userId.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to update this sleep plan'
      });
    }

    // Update sleep plan
    sleepPlan = await SleepPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: sleepPlan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
