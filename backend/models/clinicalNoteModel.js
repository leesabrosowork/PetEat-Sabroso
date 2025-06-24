const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  respiratoryRate: {
    type: Number,
    required: true
  },
  crt: {
    type: Number,
    required: true,
    description: "Capillary refill time in seconds"
  },
  skinTenting: {
    type: Boolean,
    default: false,
    description: "Indicates dehydration or other problems"
  },
  gumsColor: {
    type: String,
    enum: ['pale', 'pinkish', 'other'],
    required: true
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
  petName: {
    type: String,
    required: true
  },
  petAge: {
    type: Number,
    required: true
  },
  petSex: {
    type: String,
    required: true,
    enum: ['male', 'female', 'unknown']
  },
  petBreed: {
    type: String,
    required: true
  },
  petSpecies: {
    type: String,
    required: true
  },
  medicalHistory: {
    type: String,
    required: true
  },
  diseaseHistory: {
    type: String,
    required: true
  },
  // In-person consultation fields
  isInPerson: {
    type: Boolean,
    default: false
  },
  vitals: {
    type: vitalsSchema,
    required: function() {
      return this.isInPerson;
    }
  },
  proofOfVaccines: [{
    name: String,
    date: Date,
    validUntil: Date,
    veterinarian: String,
    documentUrl: String
  }],
  // Discharge notes
  dischargePrescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    specialInstructions: String
  }],
  clientEducation: {
    type: String,
    required: true,
    description: "Notes to client about medicines and pet care instructions"
  },
  // Common fields
  diagnosis: {
    type: String,
    required: true
  },
  treatmentPlan: {
    type: String,
    required: true
  },
  additionalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  archived: {
    type: Boolean,
    default: false,
    description: "Instead of deletion, records are archived for future reference"
  }
});

const ClinicalNote = mongoose.model('ClinicalNote', clinicalNoteSchema);
module.exports = ClinicalNote; 