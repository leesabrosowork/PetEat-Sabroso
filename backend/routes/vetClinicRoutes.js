const express = require('express');
const router = express.Router();
const vetClinicController = require('../controllers/vetClinicController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('vet clinic'));

// Dashboard overview
router.get('/dashboard', vetClinicController.getDashboardData);

// Pets management
router.get('/pets', vetClinicController.getPets);
router.put('/pets/:petId/health-status', vetClinicController.updatePetHealthStatus);

// Medical records
router.get('/medical-records', vetClinicController.getMedicalRecords);
router.post('/medical-records', vetClinicController.createMedicalRecord);
router.put('/medical-records/:petId', vetClinicController.updateMedicalRecord);

// Appointments
router.get('/appointments', vetClinicController.getAppointments);

// Video consultations
router.get('/video-consultations', vetClinicController.getVideoConsultations);

// Prescriptions
router.get('/prescriptions', vetClinicController.getPrescriptions);

// Inventory management
router.get('/inventory', vetClinicController.getInventory);
router.post('/inventory', vetClinicController.addInventoryItem);
router.put('/inventory/:id', vetClinicController.updateInventoryItem);
router.delete('/inventory/:id', vetClinicController.deleteInventoryItem);

module.exports = router; 