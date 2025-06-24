const mongoose = require('mongoose');

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
  prescription: {
    type: String
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