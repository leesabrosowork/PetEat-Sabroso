const ClinicalNote = require('../models/clinicalNoteModel');
const VideoConsultation = require('../models/videoConsultationModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');

// Create a new clinical note
exports.createClinicalNote = async (req, res) => {
  try {
    const data = req.body;
    const note = await ClinicalNote.create(data);
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('clinical_notes_updated');
    }
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all clinical notes for a consultation
exports.getNotesByConsultation = async (req, res) => {
  try {
    const notes = await ClinicalNote.find({ consultation: req.params.consultationId });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single clinical note by ID
exports.getClinicalNoteById = async (req, res) => {
  try {
    const note = await ClinicalNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback for missing info
function fallback(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return value;
}

// Get note details with fallback for missing info
exports.getNoteDetails = async (req, res) => {
  try {
    const note = await ClinicalNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const details = {
      consultation: fallback(note.consultation),
      pet: fallback(note.pet),
      author: fallback(note.author),
      vitals: note.vitals || 'N/A',
      diagnosis: fallback(note.diagnosis),
      treatmentPlan: fallback(note.treatmentPlan),
      prescription: fallback(note.prescription),
      additionalNotes: fallback(note.additionalNotes),
      createdAt: fallback(note.createdAt)
    };
    res.json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 