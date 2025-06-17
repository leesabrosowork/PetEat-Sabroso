const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');
const auth = require('../middleware/auth');

// Create a new user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get dashboard data for a user
router.get('/:userId/dashboard', auth, userController.getUserDashboard);

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get user's pets
router.get('/pets', auth, async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user.id });
    res.json({
      success: true,
      data: pets
    });
  } catch (err) {
    console.error('Error fetching user pets:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets'
    });
  }
});

module.exports = router; 