const mongoose = require('mongoose');
const User = require('../models/userModel');

async function checkClinicId() {
  try {
    await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
    console.log('Connected to MongoDB');
    
    const clinic = await User.findOne({ email: 'testclinic@petclinic.com' });
    if (clinic) {
      console.log('Test clinic ID:', clinic._id);
      console.log('Test clinic ID string:', clinic._id.toString());
      console.log('Test clinic name:', clinic.clinicName);
    } else {
      console.log('Test clinic not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkClinicId(); 