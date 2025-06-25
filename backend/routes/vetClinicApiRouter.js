const express = require('express');
const router = express.Router();
const vetClinicController = require('../controllers/vetClinicController');
const petsUnderTreatmentController = require('../controllers/petsUnderTreatmentController');
const { protect, authorize } = require('../middleware/auth');

// Add public endpoint for all approved clinics (must be before auth middleware)
router.get('/public-list', vetClinicController.getAllApprovedClinics);

// Add public endpoint for all clinics (must be before auth middleware)
router.get('/all-clinics', vetClinicController.getAllClinics);

// All routes require authentication and clinic role
router.use(protect, authorize('clinic'));

// Dashboard overview
router.get('/dashboard', vetClinicController.getDashboardData);
// Appointments
router.get('/bookings', vetClinicController.getAppointments);
router.get('/in-person-appointments', vetClinicController.getInPersonAppointments);
router.put('/bookings/:id/approve', vetClinicController.approveAppointment);
router.put('/bookings/:id/reject', vetClinicController.rejectAppointment);
router.patch('/bookings/:id/approve', vetClinicController.approveAppointment);
router.patch('/bookings/:id/reject', vetClinicController.rejectAppointment);
// Video consultations
router.get('/video-consultations', vetClinicController.getVideoConsultations);
// Inventory
router.get('/inventory', vetClinicController.getInventory);
router.post('/inventory', vetClinicController.addInventoryItem || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
router.put('/inventory/:id', vetClinicController.updateInventoryItem);
router.put('/inventory/:id/stock', vetClinicController.updateInventoryStock || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
router.delete('/inventory/:id', vetClinicController.deleteInventoryItem || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
// Pets
router.get('/pets', vetClinicController.getPets);
router.post('/pets', vetClinicController.addPet || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
// Medical Records
router.get('/medical-records', vetClinicController.getMedicalRecords);
router.post('/medical-records', vetClinicController.createMedicalRecord);
router.put('/medical-records/:petId', vetClinicController.updateMedicalRecord);
// Update pet health status
router.put('/pets/:petId/health-status', vetClinicController.updatePetHealthStatus);
// Pets under treatment
router.post('/pets-under-treatment/add', petsUnderTreatmentController.addPetUnderTreatment || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
router.put('/pets-under-treatment/update/:id', petsUnderTreatmentController.updateTreatmentStatus);
router.put('/pets-under-treatment/discharge/:id', petsUnderTreatmentController.dischargePet || ((req, res) => res.status(501).json({ success: false, message: 'Not implemented' })));
// Activity feed (if implemented)
router.get('/activity-feed', vetClinicController.getActivityFeed);
// Add more routes as needed for full dashboard functionality

module.exports = router; 