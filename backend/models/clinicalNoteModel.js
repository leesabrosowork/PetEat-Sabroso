const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  weight: Number,          // kg
  temperature: Number,     // °C
  crt: Number,             // capillary refill time seconds
  skinTenting: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const clinicalNoteSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoConsultation',
    required: true
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Online consultation fields
  petName: String,
  petAge: Number,
  petSex: String,
  petBreed: String,
  petSpecies: String,
  medicalHistory: String, // summary or reference
  diseaseHistory: String, // summary or reference
  // In-person consultation fields
  vitals: vitalsSchema,
  crt: Number,
  skinTenting: {
    type: Boolean,
    default: false
  },
  proofOfVaccines: String, // could be a file reference or text
  // Discharge notes
  prescription: String,
  clientEducation: String,
  // Common fields
  diagnosis: String,
  treatmentPlan: String,
  additionalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ClinicalNote = mongoose.model('ClinicalNote', clinicalNoteSchema);
module.exports = ClinicalNote; 