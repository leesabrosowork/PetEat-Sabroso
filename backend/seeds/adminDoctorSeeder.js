const mongoose = require('mongoose');
require('dotenv').config();
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');

const sampleDoctors = [
    {
        name: "Dr. Sarah Wilson",
        email: "sarah.wilson@petclinic.com",
        password: "DrWilson2024!",
        contact: "09111222333",
        address: "123 Medical Drive",
        availability: "available"
    },
    {
        name: "Dr. Michael Chen",
        email: "michael.chen@petclinic.com",
        password: "DrChen2024!",
        contact: "09222333444",
        address: "456 Health Avenue",
        availability: "available"
    }
];

const sampleAdmins = [
    {
        username: "admin_john",
        email: "john.admin@petclinic.com",
        password: "Admin2024!",
        contact: "09333444555"
    },
    {
        username: "admin_mary",
        email: "mary.admin@petclinic.com",
        password: "Admin2024!",
        contact: "09444555666"
    }
];

const seedAdminAndDoctors = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');

        // Clear existing doctors and admins
        await Doctor.deleteMany({});
        await Admin.deleteMany({});
        console.log('Cleared existing doctors and admins');

        // Insert sample doctors
        const createdDoctors = await Doctor.create(sampleDoctors);
        console.log('\nSample doctors created successfully:');
        createdDoctors.forEach(doctor => {
            console.log(`- Created doctor: ${doctor.name} (${doctor.email})`);
        });

        // Insert sample admins
        const createdAdmins = await Admin.create(sampleAdmins);
        console.log('\nSample admins created successfully:');
        createdAdmins.forEach(admin => {
            console.log(`- Created admin: ${admin.username} (${admin.email})`);
        });

        console.log('\nDatabase seeding completed successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the seeder
seedAdminAndDoctors(); 