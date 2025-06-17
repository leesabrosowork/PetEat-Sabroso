const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authDoctor = require('../middleware/authDoctor');
const auth = require('../middleware/auth');

// Get all prescriptions for the authenticated doctor
router.get('/doctor', authDoctor, prescriptionController.getDoctorPrescriptions);

// Create a new prescription
router.post('/', authDoctor, prescriptionController.createPrescription);

// Get all prescriptions for a user
router.get('/user', auth, prescriptionController.getUserPrescriptions);

// Delete a prescription by ID (doctor only)
router.delete('/:id', authDoctor, prescriptionController.deletePrescription);

// Get a single prescription by ID
router.get('/:id', auth, prescriptionController.getPrescriptionById);
module.exports = router;
