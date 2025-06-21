const express = require('express');
const router = express.Router();
const petsUnderTreatmentController = require('../controllers/petsUnderTreatmentController');
const { protect } = require('../middleware/auth');
const superAdminAuth = require('../middleware/superAdminAuth');

// Routes for both users and vet clinics
router.get('/treatment-details/:id', protect, petsUnderTreatmentController.getTreatmentDetails);

// User routes
router.get('/user', protect, petsUnderTreatmentController.getUserPetsUnderTreatment);

// Vet Clinic routes
router.get('/clinic', protect, petsUnderTreatmentController.getClinicPetsUnderTreatment);
router.post('/add', protect, petsUnderTreatmentController.addPetUnderTreatment);
router.patch('/update/:id', protect, petsUnderTreatmentController.updateTreatmentStatus);
router.patch('/discharge/:id', protect, petsUnderTreatmentController.dischargePet);

// Admin routes
router.get('/all', superAdminAuth, petsUnderTreatmentController.getAllPetsUnderTreatment);

module.exports = router; 