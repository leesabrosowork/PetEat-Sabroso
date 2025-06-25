const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// Get available time slots for a vet clinic
router.get('/available-slots', protect, bookingController.getAvailableTimeSlots);

// Create new booking
router.post('/', protect, bookingController.createBooking);

// Get user's bookings
router.get('/user', protect, bookingController.getUserBookings);

// Get all bookings for the authenticated vet clinic
router.get('/vet-clinic', protect, authorize('clinic'), bookingController.getClinicBookings);

// Get a single booking by ID
router.get('/:id', protect, bookingController.getBookingById);

// Update Google Meet link for a booking
router.patch('/:id/google-meet-link', protect, bookingController.updateGoogleMeetLink);

module.exports = router; 