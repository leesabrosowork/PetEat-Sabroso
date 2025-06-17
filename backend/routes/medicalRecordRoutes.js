const express = require('express');
const router = express.Router();
const {
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');

// GET: View pet medical record (all authenticated users)
router.get('/:petId', protect, getMedicalRecord);

// POST: Add new medical record (veterinarian only)
router.post('/', protect, authorize('veterinarian'), createMedicalRecord);

// PUT: Edit medical record (veterinarian only)
router.put('/:petId', protect, authorize('veterinarian'), updateMedicalRecord);

module.exports = router;
