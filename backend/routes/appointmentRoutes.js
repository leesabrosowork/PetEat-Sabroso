const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Get available time slots for a vet clinic
router.get('/available-slots', protect, appointmentController.getAvailableTimeSlots);

// Create new appointment
router.post('/', protect, appointmentController.createAppointment);

// Get user's appointments
router.get('/user', protect, appointmentController.getUserAppointments);

// Get all appointments for the authenticated vet clinic
router.get('/vet-clinic', protect, authorize('clinic'), appointmentController.getClinicAppointments);

// Get a single appointment by ID
router.get('/:id', protect, appointmentController.getAppointmentById);

module.exports = router; 