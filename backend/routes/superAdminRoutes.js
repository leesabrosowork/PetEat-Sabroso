const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// Admin management routes
router.get('/admins', protect, authorize('super admin'), superAdminController.getAllAdmins);
router.post('/admins', protect, authorize('super admin'), superAdminController.createAdmin);
router.get('/admins/:id', protect, authorize('super admin'), superAdminController.getAdminById);
router.put('/admins/:id', protect, authorize('super admin'), superAdminController.updateAdmin);
router.delete('/admins/:id', protect, authorize('super admin'), superAdminController.deleteAdmin);

// User management routes
router.get('/users', protect, authorize('super admin'), superAdminController.getAllUsers);
router.post('/users', protect, authorize('super admin'), superAdminController.createUser);
router.get('/users/:id', protect, authorize('super admin'), superAdminController.getUserById);
router.put('/users/:id', protect, authorize('super admin'), superAdminController.updateUser);
router.delete('/users/:id', protect, authorize('super admin'), superAdminController.deleteUser);

// Pet management routes
router.get('/pets', protect, authorize('super admin'), superAdminController.getAllPets);
router.post('/pets', protect, authorize('super admin'), superAdminController.createPet);
router.get('/pets/:id', protect, authorize('super admin'), superAdminController.getPetById);
router.put('/pets/:id', protect, authorize('super admin'), superAdminController.updatePet);
router.delete('/pets/:id', protect, authorize('super admin'), superAdminController.deletePet);

// Inventory management routes
router.get('/inventory', protect, authorize('super admin'), superAdminController.getAllInventory);
router.post('/inventory', protect, authorize('super admin'), superAdminController.createInventoryItem);
router.get('/inventory/:id', protect, authorize('super admin'), superAdminController.getInventoryItemById);
router.put('/inventory/:id', protect, authorize('super admin'), superAdminController.updateInventoryItem);
router.delete('/inventory/:id', protect, authorize('super admin'), superAdminController.deleteInventoryItem);
router.patch('/inventory/:id/stock', protect, authorize('super admin'), superAdminController.updateInventoryStock);

// Vet Clinic Approval Routes
router.get('/pending-vet-clinics', protect, authorize('super admin'), superAdminController.getPendingVetClinics);
router.put('/vet-clinics/:id/approve', protect, authorize('super admin'), superAdminController.approveVetClinic);
router.put('/vet-clinics/:id/reject', protect, authorize('super admin'), superAdminController.rejectVetClinic);

module.exports = router; 