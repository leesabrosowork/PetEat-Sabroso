const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// Get all prescriptions for the authenticated vet clinic
router.get('/vet-clinic', protect, authorize('vet clinic'), prescriptionController.getDoctorPrescriptions);

// Create a new prescription
router.post('/', protect, authorize('vet clinic'), prescriptionController.createPrescription);

// Get all prescriptions for a user
router.get('/user', protect, prescriptionController.getUserPrescriptions);

// Delete a prescription by ID (vet clinic only)
router.delete('/:id', protect, authorize('vet clinic'), prescriptionController.deletePrescription);

// Get a single prescription by ID
router.get('/:id', protect, prescriptionController.getPrescriptionById);

module.exports = router;
