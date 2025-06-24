const express = require('express');
const router = express.Router();
const clinicalNoteController = require('../controllers/clinicalNoteController');
const { protect } = require('../middleware/auth');

// Create new clinical note
router.post('/', protect, clinicalNoteController.createClinicalNote);

// Get all clinical notes for a consultation
router.get('/consultation/:consultationId', protect, clinicalNoteController.getNotesByConsultation);

// Get a single clinical note by ID
router.get('/:id', protect, clinicalNoteController.getClinicalNoteById);

// Get note details with fallback for missing info
router.get('/:id/details', protect, clinicalNoteController.getNoteDetails);

module.exports = router; 