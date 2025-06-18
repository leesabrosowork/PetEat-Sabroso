const mongoose = require('mongoose');
require('dotenv').config();
const Pet = require('../models/petModel');
const User = require('../models/userModel');

const seedPets = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');

        // Clear existing pets
        await Pet.deleteMany({});
        console.log('Cleared existing pets');

        // Get all users to assign pets
        const users = await User.find();
        
        // Sample pets data
        const samplePets = [
            {
                name: "Max",
                type: "dog",
                breed: "Golden Retriever",
                age: 3,
                weight: 30,
                color: "Golden",
                healthStatus: "stable",
                owner: users[0]._id // Maria's pet
            },
            {
                name: "Luna",
                type: "cat",
                breed: "Siamese Cat",
                age: 2,
                weight: 4,
                color: "Cream",
                healthStatus: "checkup",
                owner: users[0]._id // Maria's second pet
            },
            {
                name: "Rocky",
                type: "dog",
                breed: "German Shepherd",
                age: 4,
                weight: 35,
                color: "Black and Tan",
                healthStatus: "stable",
                owner: users[1]._id // James's pet
            },
            {
                name: "Bella",
                type: "dog",
                breed: "Labrador",
                age: 1,
                weight: 25,
                color: "Chocolate",
                healthStatus: "critical",
                owner: users[2]._id // Sarah's pet
            },
            {
                name: "Charlie",
                type: "dog",
                breed: "French Bulldog",
                age: 2,
                weight: 12,
                color: "Brindle",
                healthStatus: "stable",
                owner: users[3]._id // David's pet
            },
            {
                name: "Milo",
                type: "cat",
                breed: "Persian Cat",
                age: 3,
                weight: 5,
                color: "White",
                healthStatus: "checkup",
                owner: users[4]._id // Lisa's pet
            }
        ];

        // Insert sample pets
        const createdPets = await Pet.create(samplePets);
        console.log('Sample pets created successfully:');
        createdPets.forEach(pet => {
            console.log(`- Created pet: ${pet.name} (${pet.breed})`);
        });

        // Update users with their pets
        for (const pet of createdPets) {
            await User.findByIdAndUpdate(
                pet.owner,
                { $push: { pets: pet._id } },
                { new: true }
            );
        }
        console.log('\nUpdated users with their pets');

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
seedPets(); 