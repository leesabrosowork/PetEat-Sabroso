const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const superAdminAuth = require('../middleware/superAdminAuth');

// Apply super admin auth middleware to all routes
router.use(superAdminAuth);

// Admin management routes
router.get('/admins', superAdminController.getAllAdmins);
router.post('/admins', superAdminController.createAdmin);
router.get('/admins/:id', superAdminController.getAdminById);
router.put('/admins/:id', superAdminController.updateAdmin);
router.delete('/admins/:id', superAdminController.deleteAdmin);

// Doctor management routes
router.get('/doctors', superAdminController.getAllDoctors);
router.post('/doctors', superAdminController.createDoctor);
router.get('/doctors/:id', superAdminController.getDoctorById);
router.put('/doctors/:id', superAdminController.updateDoctor);
router.delete('/doctors/:id', superAdminController.deleteDoctor);

// User management routes
router.get('/users', superAdminController.getAllUsers);
router.post('/users', superAdminController.createUser);
router.get('/users/:id', superAdminController.getUserById);
router.put('/users/:id', superAdminController.updateUser);
router.delete('/users/:id', superAdminController.deleteUser);

// Pet management routes
router.get('/pets', superAdminController.getAllPets);
router.post('/pets', superAdminController.createPet);
router.get('/pets/:id', superAdminController.getPetById);
router.put('/pets/:id', superAdminController.updatePet);
router.delete('/pets/:id', superAdminController.deletePet);

// Inventory management routes
router.get('/inventory', superAdminController.getAllInventory);
router.post('/inventory', superAdminController.createInventoryItem);
router.get('/inventory/:id', superAdminController.getInventoryItemById);
router.put('/inventory/:id', superAdminController.updateInventoryItem);
router.delete('/inventory/:id', superAdminController.deleteInventoryItem);

module.exports = router; 