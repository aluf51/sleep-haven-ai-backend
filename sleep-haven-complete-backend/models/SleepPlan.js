const mongoose = require('mongoose');

const SleepPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  childName: {
    type: String,
    required: [true, 'Please provide your child\'s name'],
    trim: true
  },
  childAge: {
    type: Number,
    required: [true, 'Please provide your child\'s age in years']
  },
  childMonths: {
    type: Number,
    required: [true, 'Please provide additional months']
  },
  currentSleepIssues: {
    type: [String],
    required: [true, 'Please select at least one sleep issue']
  },
  bedTime: {
    type: String,
    required: [true, 'Please provide current bedtime']
  },
  wakeTime: {
    type: String,
    required: [true, 'Please provide current wake time']
  },
  napSchedule: {
    type: String,
    default: ''
  },
  sleepGoals: {
    type: [String],
    required: [true, 'Please select at least one sleep goal']
  },
  planDetails: {
    type: Object,
    default: {}
  },
  dailyProgress: {
    type: [Object],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
SleepPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SleepPlan', SleepPlanSchema);
