const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Route to add a doctor
router.post('/', doctorController.createDoctor);

const authDoctor = require('../middleware/authDoctor');

// Update doctor availability
router.put('/:id/availability', doctorController.updateAvailability);

// Get doctor dashboard
router.get('/dashboard', authDoctor, doctorController.getDoctorDashboard);
router.get('/patients', authDoctor, doctorController.getDoctorPatients);
module.exports = router;
