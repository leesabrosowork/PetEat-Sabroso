const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

const sampleUsers = [
    {
        username: "maria_garcia",
        email: "maria@petclinic.com",
        password: "Maria2024!",
        role: "pet owner",
        contactNumber: "09123456789",
        pets: [] // Will be populated when we create pet seeds
    },
    {
        username: "james_wilson",
        email: "james@petclinic.com",
        password: "James2024!",
        role: "pet owner",
        contactNumber: "09187654321",
        pets: []
    },
    {
        username: "sarah_johnson",
        email: "sarah@petclinic.com",
        password: "Sarah2024!",
        role: "pet owner",
        contactNumber: "09198765432",
        pets: []
    },
    {
        username: "david_brown",
        email: "david@petclinic.com",
        password: "David2024!",
        role: "pet owner",
        contactNumber: "09156789432",
        pets: []
    },
    {
        username: "lisa_anderson",
        email: "lisa@petclinic.com",
        password: "Lisa2024!",
        role: "pet owner",
        contactNumber: "09167893214",
        pets: []
    }
];

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Insert sample users
        const createdUsers = await User.create(sampleUsers);
        console.log('Sample users created successfully:');
        createdUsers.forEach(user => {
            console.log(`- Created user: ${user.username} (${user.email})`);
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
seedUsers(); 