const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventoryModel');
const authDoctor = require('../middleware/authDoctor');

// Get all medicines (inventory) for doctors
router.get('/', authDoctor, async (req, res) => {
  try {
    // Return all inventory items for now to debug
    const inventory = await Inventory.find();
    console.log('Inventory items found:', inventory.length);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 