const mongoose = require('mongoose');
const Doctor = require('../models/doctorModel');
require('dotenv').config();

const seedDoctor = async () => {
    try {
        // Connect to MongoDB using the Atlas connection string
        await mongoose.connect('mongodb+srv://obecapstone:obecapstone@cluster0.aqxgwlw.mongodb.net/petcare?retryWrites=true&w=majority');
        console.log('Connected to MongoDB');

        // Create test doctor
        const testDoctor = new Doctor({
            name: 'Dr. Sarah Smith',
            email: 'sarah@example.com',
            password: 'password123',
            contact: '123-456-7890',
            address: '123 Medical Center Dr.',
            availability: 'available'
        });

        await testDoctor.save();
        console.log('Test doctor created successfully');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error seeding doctor:', error);
        process.exit(1);
    }
};

seedDoctor(); 