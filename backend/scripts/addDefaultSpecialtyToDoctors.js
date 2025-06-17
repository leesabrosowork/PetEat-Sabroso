// Script to add a default specialty to all doctors missing it
require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/doctorModel');

const DEFAULT_SPECIALTY = 'General Practitioner';

async function addDefaultSpecialty() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
  const result = await Doctor.updateMany(
    { $or: [ { specialty: { $exists: false } }, { specialty: '' } ] },
    { $set: { specialty: DEFAULT_SPECIALTY } }
  );
  console.log(`Updated ${result.nModified || result.modifiedCount} doctors with default specialty.`);
  mongoose.disconnect();
}

addDefaultSpecialty().catch(err => {
  console.error('Error updating doctors:', err);
  mongoose.disconnect();
});
