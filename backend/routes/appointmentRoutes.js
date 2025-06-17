const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// Get all doctors with their availability
router.get('/doctors', protect, appointmentController.getAllDoctors);

// Get available time slots for a doctor
router.get('/available-slots', protect, appointmentController.getAvailableTimeSlots);

// Create new appointment
router.post('/', protect, appointmentController.createAppointment);

// Get user's appointments
router.get('/user', protect, appointmentController.getUserAppointments);

// Get all appointments for the authenticated doctor
router.get('/doctor', protect, appointmentController.getDoctorAppointments);

// Get a single appointment by ID
router.get('/:id', protect, appointmentController.getAppointmentById);

module.exports = router; 