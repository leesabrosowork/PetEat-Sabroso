const mongoose = require('mongoose');
const User = require('./models/userModel');
const Doctor = require('./models/doctorModel');
const Pet = require('./models/petModel');
const Inventory = require('./models/inventoryModel');

async function addTestData() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
        console.log('Connected to MongoDB');

        // Check existing data
        const existingUsers = await User.find();
        const existingDoctors = await Doctor.find();
        const existingPets = await Pet.find();
        const existingInventory = await Inventory.find();

        console.log('Existing data:');
        console.log('Users:', existingUsers.length);
        console.log('Doctors:', existingDoctors.length);
        console.log('Pets:', existingPets.length);
        console.log('Inventory:', existingInventory.length);

        if (existingUsers.length > 0) {
            console.log('Sample user:', existingUsers[0].username, existingUsers[0].email);
        }
        if (existingPets.length > 0) {
            console.log('Sample pet:', existingPets[0].name, 'Owner:', existingPets[0].owner);
        }
        if (existingInventory.length > 0) {
            console.log('Sample inventory:', existingInventory[0].item, existingInventory[0].category);
        }

        // Check if we need to add more data
        if (existingPets.length === 0) {
            console.log('No pets found, creating test pet...');
            const user = existingUsers[0] || await User.create({
                username: 'testuser2',
                email: 'testuser2@example.com',
                password: 'password123',
                role: 'pet owner',
                contactNumber: '09123456788'
            });

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
        }

        if (existingInventory.length === 0) {
            console.log('No inventory found, creating test inventory...');
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
                }
            ];

            await Inventory.insertMany(inventoryItems);
            console.log('Created inventory items');
        }

        console.log('Test data check completed!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
}

addTestData(); 