const mongoose = require('mongoose');
const User = require('../models/userModel');

async function checkAllClinics() {
  try {
    await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
    console.log('Connected to MongoDB');
    
    const clinics = await User.find({ role: 'clinic' });
    console.log(`Found ${clinics.length} clinics:`);
    
    clinics.forEach(clinic => {
      console.log(`- ID: ${clinic._id}`);
      console.log(`  Name: ${clinic.clinicName}`);
      console.log(`  Email: ${clinic.email}`);
      console.log(`  Status: ${clinic.status}`);
      console.log(`  Approved: ${clinic.isApproved}`);
      console.log('---');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllClinics(); 