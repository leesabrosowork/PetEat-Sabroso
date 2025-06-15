const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventoryModel');
const authDoctor = require('../middleware/authDoctor');

// Get all medicines (inventory) for doctors
router.get('/', authDoctor, async (req, res) => {
  try {
    const inventory = await Inventory.find({ category: 'Medication' });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 