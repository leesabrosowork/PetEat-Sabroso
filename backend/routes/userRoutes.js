const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');
const { protect } = require('../middleware/auth');

// Create a new user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get user profile
router.get('/profile', protect, userController.getUserProfile);

// Get dashboard data for a user
router.get('/:userId/dashboard', protect, userController.getUserDashboard);

// Update user profile
router.put('/profile', protect, userController.updateUserProfile);

// Get user's pets
router.get('/pets', protect, userController.getUserPets);

// Delete user account
router.delete('/delete-account', protect, userController.deleteAccount);

module.exports = router; 