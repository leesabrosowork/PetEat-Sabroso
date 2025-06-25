const mongoose = require('mongoose');
require('dotenv').config();

async function addIndexes() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Get all models
        const Pet = require('../models/petModel');
        const User = require('../models/userModel');
        const Booking = require('../models/bookingModel');
        const Inventory = require('../models/inventoryModel');
        const EMR = require('../models/emrModel');
        const Activity = require('../models/activityModel');

        console.log('Adding indexes...');

        // Add indexes for Pet model
        await Pet.collection.createIndex({ owner: 1 });
        await Pet.collection.createIndex({ healthStatus: 1 });
        await Pet.collection.createIndex({ type: 1 });
        await Pet.collection.createIndex({ createdAt: -1 });
        await Pet.collection.createIndex({ owner: 1, healthStatus: 1 });
        console.log('✅ Pet indexes added');

        // Add indexes for User model
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ status: 1 });
        await User.collection.createIndex({ email: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        await User.collection.createIndex({ role: 1, status: 1 });
        console.log('✅ User indexes added');

        // Add indexes for Booking model
        await Booking.collection.createIndex({ clinic: 1, bookingDate: 1, appointmentTime: 1 });
        await Booking.collection.createIndex({ petOwner: 1 });
        await Booking.collection.createIndex({ status: 1 });
        await Booking.collection.createIndex({ bookingDate: 1 });
        await Booking.collection.createIndex({ type: 1 });
        console.log('✅ Booking indexes added');

        // Add indexes for Inventory model
        await Inventory.collection.createIndex({ status: 1 });
        await Inventory.collection.createIndex({ category: 1 });
        await Inventory.collection.createIndex({ stock: 1 });
        await Inventory.collection.createIndex({ createdAt: -1 });
        await Inventory.collection.createIndex({ status: 1, stock: 1 });
        console.log('✅ Inventory indexes added');

        // Add indexes for EMR model
        await EMR.collection.createIndex({ petId: 1 });
        await EMR.collection.createIndex({ createdAt: -1 });
        console.log('✅ EMR indexes added');

        // Add indexes for Activity model
        await Activity.collection.createIndex({ createdAt: -1 });
        await Activity.collection.createIndex({ user: 1 });
        await Activity.collection.createIndex({ clinic: 1 });
        console.log('✅ Activity indexes added');

        console.log('🎉 All indexes added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding indexes:', error);
        process.exit(1);
    }
}

addIndexes(); 