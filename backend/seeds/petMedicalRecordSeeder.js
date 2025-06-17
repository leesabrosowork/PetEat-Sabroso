const mongoose = require('mongoose');
require('dotenv').config();
const Pet = require('../models/petModel');
const User = require('../models/userModel');
const PetMedicalRecord = require('../models/petMedicalRecord');

const seedPetMedicalRecords = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');

        // Fetch all pets with owner populated
        const pets = await Pet.find().populate('owner');
        if (!pets.length) {
            console.log('No pets found. Seed pets first.');
            process.exit(0);
        }

        // Clear existing medical records
        await PetMedicalRecord.deleteMany({});
        console.log('Cleared existing pet medical records');

        // For each pet, create a sample EMR
        const records = pets.map((pet, idx) => {
            return {
                petId: pet._id,
                name: pet.name,
                species: pet.type || pet.species || 'Dog',
                breed: pet.breed || 'Unknown',
                age: pet.age || 1,
                sex: pet.gender || pet.sex || 'male',
                owner: {
                    name: pet.owner?.name || 'Unknown',
                    phone: pet.owner?.phone || '09170000000',
                    email: pet.owner?.email || 'owner@example.com',
                    address: pet.owner?.address || 'Unknown Address'
                },
                vaccinations: [
                    {
                        name: 'Rabies',
                        dateAdministered: '2024-01-01',
                        nextDueDate: '2025-01-01',
                        veterinarian: 'Dr. Vet'
                    }
                ],
                medicalHistory: [
                    {
                        condition: 'Allergy',
                        diagnosisDate: '2024-02-15',
                        treatment: 'Antihistamines',
                        status: 'resolved'
                    }
                ],
                visitHistory: [
                    {
                        date: '2024-03-10',
                        reason: 'Annual Checkup',
                        notes: 'Healthy.',
                        veterinarian: 'Dr. Vet'
                    }
                ]
            }
        });

        // Insert records
        await PetMedicalRecord.insertMany(records);
        console.log(`Inserted ${records.length} pet medical records.`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding pet medical records:', err);
        process.exit(1);
    }
};

seedPetMedicalRecords();
