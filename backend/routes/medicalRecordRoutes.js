const express = require('express');
const router = express.Router();
const {
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
} = require('../controllers/medicalRecordController');
const auth = require('../middleware/auth'); // expects req.user.role

// Helper middleware to check veterinarian role
function vetOnly(req, res, next) {
  if (req.user && req.user.role === 'veterinarian') return next();
  return res.status(403).json({ message: 'Forbidden: Veterinarian access only' });
}

// GET: View pet medical record (all authenticated users)
router.get('/:petId', auth, getMedicalRecord);

// POST: Add new medical record (veterinarian only)
router.post('/', auth, vetOnly, createMedicalRecord);

// PUT: Edit medical record (veterinarian only)
router.put('/:petId', auth, vetOnly, updateMedicalRecord);

module.exports = router;
