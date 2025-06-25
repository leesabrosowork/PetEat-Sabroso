const mongoose = require('mongoose');
const Inventory = require('../models/inventoryModel');
require('dotenv').config();

const seedInventory = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Clear existing inventory
        await Inventory.deleteMany({});
        console.log('Cleared existing inventory');

        // Create sample inventory items
        const inventoryItems = [
            {
                item: 'Heartgard Plus',
                stock: 50,
                minStock: 10,
                category: 'Medication',
                status: 'in-stock'
            },
            {
                item: 'Frontline Plus',
                stock: 30,
                minStock: 8,
                category: 'Medication',
                status: 'in-stock'
            },
            {
                item: 'Rabies Vaccine',
                stock: 15,
                minStock: 5,
                category: 'Medication',
                status: 'low-stock'
            },
            {
                item: 'Bandages (3M)',
                stock: 100,
                minStock: 20,
                category: 'Supplies',
                status: 'in-stock'
            },
            {
                item: 'Syringes (10ml)',
                stock: 0,
                minStock: 15,
                category: 'Supplies',
                status: 'out-of-stock'
            },
            {
                item: 'Antibiotics (Amoxicillin)',
                stock: 25,
                minStock: 10,
                category: 'Medication',
                status: 'in-stock'
            },
            {
                item: 'Surgical Gloves (Large)',
                stock: 75,
                minStock: 15,
                category: 'Supplies',
                status: 'in-stock'
            },
            {
                item: 'X-Ray Film',
                stock: 8,
                minStock: 5,
                category: 'Equipment',
                status: 'low-stock'
            }
        ];

        await Inventory.insertMany(inventoryItems);
        console.log(`Created ${inventoryItems.length} sample inventory items`);
        console.log('Inventory is now populated with sample data');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding inventory:', err);
        process.exit(1);
    }
};

seedInventory(); 