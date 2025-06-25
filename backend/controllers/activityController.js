const Activity = require('../models/activityModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');

// Get latest activities (limit 20)
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name email')
      .populate('clinic', 'name')
      .populate('pet', 'name');
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 