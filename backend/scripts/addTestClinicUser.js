const mongoose = require('mongoose');
const User = require('../models/userModel');

async function addTestClinicUser() {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully');

    // Check if test clinic user already exists
    const existingUser = await User.findOne({ email: 'testclinic@petclinic.com' });
    if (existingUser) {
      console.log('Test clinic user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create test clinic user
    const testClinicUser = new User({
      username: 'testclinic',
      email: 'testclinic@petclinic.com',
      password: 'TestClinic123!',
      fullName: 'Test Veterinary Clinic',
      contactNumber: '09123456789',
      role: 'clinic',
      clinicName: 'Test Veterinary Clinic',
      licenseNumber: 'TEST123456',
      description: 'A test veterinary clinic for development purposes',
      status: 'approved', // Set to approved so they can log in
      isVerified: true, // Set to verified so they can log in
      address: '123 Test Street, Test City',
      location: {
        type: 'Point',
        coordinates: [120.9842, 14.5995], // Manila coordinates
        address: '123 Test Street',
        city: 'Test City',
        province: 'Test Province',
        zipCode: '1234'
      },
      operatingHours: {
        mondayToFriday: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 3:00 PM',
        sunday: 'Closed'
      },
      petsManaged: ['Dogs', 'Cats', 'Birds', 'Small Mammals'],
      needsOnboarding: false,
      completedOnboarding: true
    });

    await testClinicUser.save();
    console.log('Test clinic user created successfully:');
    console.log(`- Email: ${testClinicUser.email}`);
    console.log(`- Password: TestClinic123!`);
    console.log(`- Role: ${testClinicUser.role}`);
    console.log(`- Status: ${testClinicUser.status}`);

  } catch (error) {
    console.error('Error creating test clinic user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

addTestClinicUser(); 