const mongoose = require('mongoose');
const VetClinic = require('../models/vetClinicModel');
require('dotenv').config();

const seedVetClinics = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Clear existing vet clinics
        await VetClinic.deleteMany({});
        console.log('Cleared existing vet clinics');

        // Create demo vet clinic
        const demoVetClinic = await VetClinic.create({
            clinicName: 'Demo Veterinary Clinic',
            ownerName: 'Dr. John Smith',
            email: 'vetclinic@peteat.com',
            password: 'vetclinic123',
            phoneNumber: '09171234567',
            location: {
                address: '123 Main Street',
                city: 'Manila',
                province: 'Metro Manila',
                zipCode: '1000'
            },
            licenseNumber: 'VET-2024-001',
            businessPermit: '/uploads/business-permits/demo-permit.pdf',
            clinicType: 'Small Animal Practice',
            openingHours: {
                mondayToFriday: '8:00 AM - 6:00 PM',
                saturday: '9:00 AM - 3:00 PM',
                sunday: 'Closed'
            },
            servicesOffered: [
                'General Checkup',
                'Vaccination',
                'Surgery',
                'Emergency Care',
                'Dental Care',
                'Laboratory Tests'
            ],
            animalsCatered: ['Dogs', 'Cats', 'Birds', 'Small Mammals'],
            status: 'approved',
            isVerified: true,
            role: 'vet clinic'
        });

        console.log(`Created demo vet clinic: ${demoVetClinic.clinicName}`);
        console.log('Email: vetclinic@peteat.com');
        console.log('Password: vetclinic123');
        console.log('Status: approved');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding vet clinics:', err);
        process.exit(1);
    }
};

seedVetClinics(); 