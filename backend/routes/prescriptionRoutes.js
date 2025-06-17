const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// Get all prescriptions for the authenticated doctor
router.get('/doctor', protect, authorize('doctor'), prescriptionController.getDoctorPrescriptions);

// Create a new prescription
router.post('/', protect, authorize('doctor'), prescriptionController.createPrescription);

// Get all prescriptions for a user
router.get('/user', protect, prescriptionController.getUserPrescriptions);

// Delete a prescription by ID (doctor only)
router.delete('/:id', protect, authorize('doctor'), prescriptionController.deletePrescription);

// Get a single prescription by ID
router.get('/:id', protect, prescriptionController.getPrescriptionById);

module.exports = router;
