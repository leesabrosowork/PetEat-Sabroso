const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medication: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  specialInstructions: String
}, { _id: false });

const videoConsultationSchema = new mongoose.Schema({
  petOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  sessionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  diagnosis: {
    type: String
  },
  prescription: [prescriptionSchema],
  clientEducation: {
    type: String,
    description: "Instructions and notes for the client about pet care and medications"
  },
  requireCamera: {
    type: Boolean,
    default: true,
    description: "Indicates if camera is required for both parties"
  },
  cameraEnabled: {
    type: Boolean,
    default: false,
    description: "Tracks if camera is currently enabled during consultation"
  },
  followUpRecommended: {
    type: Boolean,
    default: false
  },
  zoomJoinUrl: {
    type: String
  },
  zoomMeetingId: {
    type: String
  },
  googleMeetLink: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const VideoConsultation = mongoose.model('VideoConsultation', videoConsultationSchema);
module.exports = VideoConsultation; 