const mongoose = require('mongoose');
const Activity = require('../models/activityModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Doctor = require('../models/doctorModel');
require('dotenv').config();

const seedActivities = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Get some existing users, pets, and doctors for references
        const users = await User.find().limit(3);
        const pets = await Pet.find().limit(3);
        const doctors = await Doctor.find().limit(2);

        if (users.length === 0 || pets.length === 0 || doctors.length === 0) {
            console.log('Please seed users, pets, and doctors first');
            process.exit(1);
        }

        // Clear existing activities
        await Activity.deleteMany({});
        console.log('Cleared existing activities');

        // Create sample activities
        const activities = [
            {
                type: 'appointment',
                description: 'New appointment scheduled for Max (Golden Retriever)',
                user: users[0]._id,
                pet: pets[0]._id,
                doctor: doctors[0]._id,
                createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
            },
            {
                type: 'registration',
                description: 'New pet registration: Luna (Persian Cat)',
                user: users[1]._id,
                pet: pets[1]._id,
                createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
            },
            {
                type: 'inventory',
                description: 'Inventory updated: Added 50 units of Heartgard Plus',
                createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            },
            {
                type: 'pet',
                description: 'Health status updated for Buddy (Labrador): Stable',
                user: users[2]._id,
                pet: pets[2]._id,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                type: 'appointment',
                description: 'Appointment completed: Bella (Siamese Cat) - Vaccination',
                user: users[0]._id,
                pet: pets[0]._id,
                doctor: doctors[1]._id,
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
            },
            {
                type: 'inventory',
                description: 'Low stock alert: Rabies vaccine (5 units remaining)',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            }
        ];

        await Activity.insertMany(activities);
        console.log(`Created ${activities.length} sample activities`);
        console.log('Activity feed is now populated with sample data');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding activities:', err);
        process.exit(1);
    }
};

seedActivities(); 