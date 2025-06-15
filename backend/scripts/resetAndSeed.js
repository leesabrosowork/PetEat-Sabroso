const mongoose = require('mongoose');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const Pet = require('../models/petModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const Inventory = require('../models/inventoryModel');

async function resetAndSeed() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
        console.log('Connected to MongoDB successfully');

        // 1. Remove all data
        await Promise.all([
            User.deleteMany({}),
            Doctor.deleteMany({}),
            Admin.deleteMany({}),
            Staff.deleteMany({}),
            Pet.deleteMany({}),
            PetMedicalRecord.deleteMany({}),
            Inventory.deleteMany({})
        ]);
        console.log('Cleared all existing data');

        // 2. Use plain text passwords (let model pre-save hooks hash them)
        const adminPassword = 'admin123';
        const doctorPassword = 'doctor123';
        const userPassword = 'user123';
        const staffPassword = 'staff123';

        // 3. Insert one admin
        const admin = await Admin.create({
            username: 'admin',
            email: 'admin@PetEat.com',
            password: adminPassword,
            contact: '09999999999',
            role: 'admin'
        });
        console.log('Created admin:', admin.email);

        // 4. Insert one doctor
        const doctor = await Doctor.create({
            name: 'Dr. Vet',
            email: 'doctor@PetEat.com',
            password: doctorPassword,
            availability: 'available',
            role: 'doctor',
            contact: '09112223333',
            address: '456 Clinic Road'
        });
        console.log('Created doctor:', doctor.email);

        // 5. Insert one user
        const user = await User.create({
            username: 'petowner',
            email: 'user@PetEat.com',
            password: userPassword,
            role: 'pet owner',
            contactNumber: '09123456789'
        });
        console.log('Created user:', user.email);

        // 6. Insert one staff
        const staff = await Staff.create({
            name: 'John Staff',
            email: 'staff@PetEat.com',
            password: staffPassword,
            role: 'staff',
            contact: '09123456788',
            address: '789 Shop Street'
        });
        console.log('Created staff:', staff.email);

        // 7. Insert one pet for the user
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

        // 8. Insert one EMR for the pet
        await PetMedicalRecord.create({
            petId: pet._id.toString(),
            name: 'Buddy',
            species: 'dog',
            breed: 'Labrador',
            age: 4,
            sex: 'male',
            owner: {
                name: user.username,
                phone: user.contactNumber,
                email: user.email,
                address: '123 Pet Street'
            },
            vaccinations: [],
            medicalHistory: [],
            visitHistory: []
        });
        console.log('Created EMR for pet');

        // 9. Insert sample inventory items
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
            }
        ];

        await Inventory.insertMany(inventoryItems);
        console.log('Created inventory items');

        console.log('\nDatabase reset and seeded successfully!');
        console.log('\nCredentials:');
        console.log('Admin:', { email: 'admin@PetEat.com', password: 'admin123' });
        console.log('Doctor:', { email: 'doctor@PetEat.com', password: 'doctor123' });
        console.log('User:', { email: 'user@PetEat.com', password: 'user123' });
        console.log('Staff:', { email: 'staff@PetEat.com', password: 'staff123' });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the script
resetAndSeed(); 