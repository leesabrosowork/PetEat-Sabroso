const express = require('express');
const router = express.Router();
const { 
    registerStaff, 
    loginStaff, 
    getStaffProfile,
    getInventory,
    updateInventoryStock
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerStaff);
router.post('/login', loginStaff);

// Protected routes
router.get('/profile', protect, getStaffProfile);
router.get('/inventory', protect, getInventory);
router.put('/inventory/:id', protect, updateInventoryStock);

module.exports = router; 