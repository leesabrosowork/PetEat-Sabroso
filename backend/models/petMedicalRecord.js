const mongoose = require('mongoose');

const VaccinationRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateAdministered: { type: String, required: true },
  nextDueDate: { type: String, required: true },
  veterinarian: { type: String, required: true }
}, { _id: false });

const MedicalConditionSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  diagnosisDate: { type: String, required: true },
  treatment: { type: String, required: true },
  status: { type: String, enum: ['ongoing', 'resolved'], required: true }
}, { _id: false });

const VisitRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  reason: { type: String, required: true },
  notes: { type: String, required: true },
  veterinarian: { type: String, required: true }
}, { _id: false });

const PetMedicalRecordSchema = new mongoose.Schema({
  petId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  sex: { type: String, enum: ['male', 'female'], required: true },
  owner: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true }
  },
  vaccinations: [VaccinationRecordSchema],
  medicalHistory: [MedicalConditionSchema],
  visitHistory: [VisitRecordSchema]
}, { timestamps: true });

module.exports = mongoose.model('PetMedicalRecord', PetMedicalRecordSchema);
