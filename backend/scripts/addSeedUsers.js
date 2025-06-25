const mongoose = require('mongoose');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');

async function addSeedUsers() {
  await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d'); // Change to your DB name

  // Add User
  const user = new User({
    username: 'petowner',
    email: 'user@PetEat.com',
    password: 'user123', // Will be hashed by pre-save hook
    contactNumber: '09123456789',
    role: 'pet owner'
  });
  await user.save();
  console.log('User added:', user.email);

  // Add Doctor
  const doctor = new Doctor({
    name: 'Dr. Vet',
    email: 'doctor@PetEat.com',
    password: 'doctor123', // Will be hashed by pre-save hook
    contact: '09112223333',
    address: '456 Clinic Road',
    role: 'doctor',
    availability: 'available'
  });
  await doctor.save();
  console.log('Doctor added:', doctor.email);

  // Add Admin
  const admin = new Admin({
    username: 'admin',
    email: 'admin@PetEat.com',
    password: 'admin123', // Will be hashed by pre-save hook
    contact: '09999999999',
    role: 'admin'
  });
  await admin.save();
  console.log('Admin added:', admin.email);

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

addSeedUsers().catch(console.error); 