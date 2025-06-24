const VideoConsultation = require('../models/videoConsultationModel');
const ClinicalNote = require('../models/clinicalNoteModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');

// Create a new video consultation
exports.createVideoConsultation = async (req, res) => {
  try {
    const data = req.body;
    const consultation = await VideoConsultation.create(data);
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('video_consultations_updated');
    }
    res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all video consultations for a user (pet owner or clinic)
exports.getUserVideoConsultations = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let consultations;
    if (role === 'clinic') {
      consultations = await VideoConsultation.find({ clinic: userId });
    } else {
      consultations = await VideoConsultation.find({ petOwner: userId });
    }
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single video consultation by ID
exports.getVideoConsultationById = async (req, res) => {
  try {
    const consultation = await VideoConsultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of a video consultation
exports.updateVideoConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const consultation = await VideoConsultation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback for missing info
function fallback(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return value;
}

// Get consultation details with fallback for missing info
exports.getConsultationDetails = async (req, res) => {
  try {
    const consultation = await VideoConsultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const details = {
      petOwner: fallback(consultation.petOwner),
      clinic: fallback(consultation.clinic),
      pet: fallback(consultation.pet),
      scheduledTime: fallback(consultation.scheduledTime),
      duration: fallback(consultation.duration),
      sessionId: fallback(consultation.sessionId),
      status: fallback(consultation.status),
      notes: fallback(consultation.notes),
      diagnosis: fallback(consultation.diagnosis),
      prescription: fallback(consultation.prescription),
      followUpRecommended: fallback(consultation.followUpRecommended),
      createdAt: fallback(consultation.createdAt)
    };
    res.json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 