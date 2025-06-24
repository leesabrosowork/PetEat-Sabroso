const mongoose = require('mongoose');

// Vaccination Record Schema
const VaccinationRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateAdministered: { type: String, required: true },
  nextDueDate: { type: String, required: true },
  veterinarian: { type: String, required: true }
}, { _id: false });

// Medical Condition Schema
const MedicalConditionSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  diagnosisDate: { type: String, required: true },
  treatment: { type: String, required: true },
  status: { type: String, enum: ['ongoing', 'resolved'], required: true }
}, { _id: false });

// Visit Record Schema
const VisitRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  reason: { type: String, required: true },
  notes: { type: String, required: true },
  veterinarian: { type: String, required: true }
}, { _id: false });

// Medication Schema
const MedicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true }
}, { _id: false });

const emrSchema = new mongoose.Schema({
    // Pet Information
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    species: {
        type: String,
        required: true
    },
    breed: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    sex: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    
    // Owner Information
    owner: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        address: {
            type: String,
            default: ''
        }
    },
    
    // Medical Records
    vaccinations: [VaccinationRecordSchema],
    medicalHistory: [MedicalConditionSchema],
    visitHistory: [VisitRecordSchema],
    
    // Current Visit Information (for new EMR entries)
    currentVisit: {
        date: { type: String },
        diagnosis: { type: String },
        treatment: { type: String },
        medications: [MedicationSchema],
        notes: { type: String },
        followUpDate: { type: String },
        status: {
            type: String,
            enum: ['active', 'resolved', 'ongoing'],
            default: 'active'
        }
    },
    
    // Doctor who created/updated the record
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Attachments
    attachments: [{
        type: String, // URLs to stored files
        description: String
    }]
}, {
    timestamps: true
});

const EMR = mongoose.model('EMR', emrSchema);
module.exports = EMR; 