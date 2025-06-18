const mongoose = require('mongoose');
const User = require('./models/userModel');
const Doctor = require('./models/doctorModel');
const Pet = require('./models/petModel');
const Inventory = require('./models/inventoryModel');

async function quickSeed() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
        console.log('Connected to MongoDB successfully');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Doctor.deleteMany({}),
            Pet.deleteMany({}),
            Inventory.deleteMany({})
        ]);
        console.log('Cleared existing data');

        // Create a user
        const user = await User.create({
            username: 'testuser',
            email: 'user@test.com',
            password: 'password123',
            role: 'pet owner',
            contactNumber: '09123456789'
        });
        console.log('Created user:', user.email);

        // Create a doctor
        const doctor = await Doctor.create({
            name: 'Dr. Test',
            email: 'doctor@test.com',
            password: 'password123',
            availability: 'available',
            role: 'doctor',
            contact: '09112223333',
            address: '123 Test Street',
            specialty: 'General Veterinary Medicine'
        });
        console.log('Created doctor:', doctor.email);

        // Create a pet for the user
        const pet = await Pet.create({
            name: 'Buddy',
            type: 'dog',
            breed: 'Labrador',
            age: 4,
            weight: 25,
            color: 'Yellow',
            gender: 'male',
            owner: user._id
        });
        console.log('Created pet:', pet.name);

        // Create inventory items (medicines)
        const inventoryItems = [
            {
                item: 'Amoxicillin',
                category: 'Medication',
                stock: 100,
                minStock: 20,
                status: 'in-stock'
            },
            {
                item: 'Ivermectin',
                category: 'Medication',
                stock: 50,
                minStock: 10,
                status: 'in-stock'
            },
            {
                item: 'Prednisone',
                category: 'Medication',
                stock: 75,
                minStock: 15,
                status: 'in-stock'
            },
            {
                item: 'Heartgard Plus',
                category: 'Medication',
                stock: 30,
                minStock: 8,
                status: 'in-stock'
            }
        ];

        await Inventory.insertMany(inventoryItems);
        console.log('Created inventory items');

        console.log('\nQuick seeding completed!');
        console.log('\nTest credentials:');
        console.log('User:', { email: 'user@test.com', password: 'password123' });
        console.log('Doctor:', { email: 'doctor@test.com', password: 'password123' });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

quickSeed(); 