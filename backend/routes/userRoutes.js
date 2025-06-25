const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Booking = require('../models/bookingModel');
const { protect } = require('../middleware/auth');

// Create a new user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get approved clinics (public endpoint)
router.get('/approved-clinics', userController.getApprovedClinics);

// Search users by name or email
router.get('/search', protect, userController.searchUsers);

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