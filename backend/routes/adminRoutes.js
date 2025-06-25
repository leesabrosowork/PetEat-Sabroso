const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { cacheMiddleware } = require('../middleware/cache');

// Public route - Allow admin creation without authentication
router.post('/', adminController.createAdmin);

// Protected dashboard routes
router.get('/dashboard/overview', adminAuth, cacheMiddleware(60000), adminController.getDashboardOverview);
router.get('/dashboard/all-data', adminAuth, cacheMiddleware(30000), adminController.getAllDashboardData);
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/pets', adminAuth, adminController.getAllPets);
router.get('/inventory', adminAuth, adminController.getInventory);
router.get('/recent-activities', adminAuth, adminController.getRecentActivities);
router.post('/inventory', adminAuth, adminController.createInventoryItem);
router.put('/settings', adminAuth, adminController.updateSettings);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
router.put('/pets/:id', adminAuth, adminController.updatePet);
router.delete('/pets/:id', adminAuth, adminController.deletePet);
router.get('/settings', adminController.getSettings);
router.put('/inventory/:id', adminAuth, adminController.updateInventoryItem);
router.delete('/inventory/:id', adminAuth, adminController.deleteInventoryItem);
router.patch('/inventory/:id/stock', adminAuth, adminController.updateInventoryStock);
router.post('/reset-seed', adminAuth, adminController.resetAndSeed);

module.exports = router;