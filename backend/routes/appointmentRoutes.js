const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

// Get all doctors with availability status
router.get('/doctors', auth, appointmentController.getAllDoctors);

// Get available time slots for a doctor
router.get('/available-slots', auth, appointmentController.getAvailableTimeSlots);

// Create new appointment
router.post('/', auth, appointmentController.createAppointment);

// Get user's appointments
router.get('/user', auth, appointmentController.getUserAppointments);

// Get all appointments for the authenticated doctor
router.get('/doctor', auth, appointmentController.getDoctorAppointments);

// Get single appointment by ID
router.get('/:id', auth, appointmentController.getAppointmentById);

module.exports = router; 