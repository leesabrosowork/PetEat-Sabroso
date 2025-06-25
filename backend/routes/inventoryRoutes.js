const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Inventory = require('../models/inventoryModel');

// Get all medicines (inventory) for vet clinics
router.get('/', protect, authorize('clinic'), async (req, res) => {
  try {
    // Return all inventory items for now to debug
    const inventory = await Inventory.find();
    console.log('Inventory items found:', inventory.length);
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 