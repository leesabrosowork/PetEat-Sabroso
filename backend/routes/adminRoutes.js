const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public route - Allow admin creation without authentication
router.post('/', adminController.createAdmin);


// Protected dashboard routes
router.get('/dashboard/overview', adminAuth, adminController.getDashboardOverview);
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/doctors', adminAuth, adminController.getAllDoctors);
router.get('/doctor-specialties', adminAuth, adminController.getDoctorSpecialties);
router.get('/pets', adminAuth, adminController.getAllPets);
router.get('/inventory', adminAuth, adminController.getInventory);
router.get('/recent-activities', adminAuth, adminController.getRecentActivities);
router.post('/inventory', adminAuth, adminController.createInventoryItem);

module.exports = router;
router.put('/settings', adminAuth, adminController.updateSettings);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
router.put('/doctors/:id', adminAuth, adminController.updateDoctor);
router.delete('/doctors/:id', adminAuth, adminController.deleteDoctor);
router.put('/pets/:id', adminAuth, adminController.updatePet);
router.delete('/pets/:id', adminAuth, adminController.deletePet);
router.get('/settings', adminController.getSettings);
router.put('/inventory/:id', adminAuth, adminController.updateInventoryItem);
router.delete('/inventory/:id', adminAuth, adminController.deleteInventoryItem);
router.post('/reset-seed', adminAuth, adminController.resetAndSeed);