const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Pet = require('../models/petModel');
const Appointment = require('../models/appointmentModel');
const Inventory = require('../models/inventoryModel');
const Activity = require('../models/activityModel');
const Admin = require('../models/adminModel');
const Settings = require('../models/settingsModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const bcrypt = require('bcrypt');

// Get all distinct doctor specialties
exports.getDoctorSpecialties = async (req, res) => {
    try {
        const specialties = await Doctor.distinct('specialty');
        res.json({ success: true, data: specialties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get dashboard overview data
exports.getDashboardOverview = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const doctorCount = await Doctor.countDocuments();
        const petCount = await Pet.countDocuments();
        const inventoryCount = await Inventory.countDocuments();

        const availableDoctors = await Doctor.countDocuments({ availability: 'available' });

        const lowStockItems = await Inventory.countDocuments({
            $or: [
                { status: 'low-stock' },
                { status: 'out-of-stock' }
            ]
        });

        res.json({
            success: true,
            data: {
                userCount,
                doctorCount,
                petCount,
                inventoryCount,
                availableDoctors,
                lowStockItems
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pets
exports.getAllPets = async (req, res) => {
    try {
        const pets = await Pet.find().populate('owner', 'name email');
        res.json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get inventory items
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name')
            .populate('doctor', 'name');
        res.json({ success: true, data: activities });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, contact } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [
                { email },
                { contact }
            ]
        });
        if (existingAdmin) {
            return res.status(400).json({
                status: 'fail',
                message: existingAdmin.email === email ?
                    'Email already in use' :
                    'Contact number already in use'
            });
        }

        // Create new admin
        const newAdmin = await Admin.create({
            username,
            email,
            password, // will be hashed by pre-save middleware
            contact
        });

        // Remove password from response
        newAdmin.password = undefined;

        res.status(201).json({
            status: 'success',
            data: {
                admin: newAdmin
            }
        });
    } catch (error) {
        console.error('Admin creation error:', error); // Add this for debugging
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
// Create a new inventory item
exports.createInventoryItem = async (req, res) => {
    try {
        const { item, category, stock, minStock } = req.body;

        // Create new inventory item
        const newItem = await Inventory.create({
            item,
            category,
            stock,
            minStock,
            status: stock > minStock ? 'in-stock' : 'low-stock'
        });

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const { notifications, maintenanceMode } = req.body;

        // Find the settings document and update it, or create it if it doesn't exist
        let settings = await Settings.findOneAndUpdate({}, { notifications, maintenanceMode }, { new: true, upsert: true });

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, status } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, { username, email, role, status }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a doctor
exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, specialty, availability } = req.body;

        const updatedDoctor = await Doctor.findByIdAndUpdate(id, { name, specialty, availability }, { new: true });

        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json({
            success: true,
            data: updatedDoctor
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedDoctor = await Doctor.findByIdAndDelete(id);

        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json({
            success: true,
            message: 'Doctor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a pet
exports.updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, breed, age } = req.body;

        const updatedPet = await Pet.findByIdAndUpdate(id, { name, type, breed, age }, { new: true });

        if (!updatedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        res.json({
            success: true,
            data: updatedPet
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a pet
exports.deletePet = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPet = await Pet.findByIdAndDelete(id);

        if (!deletedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update an inventory item
exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item, category, stock, minStock } = req.body;

        const updatedItem = await Inventory.findByIdAndUpdate(id, { item, category, stock, minStock }, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete an inventory item
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await Inventory.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetAndSeed = async (req, res) => {
    try {
        // 1. Remove all data
        await Promise.all([
            User.deleteMany({}),
            Doctor.deleteMany({}),
            Admin.deleteMany({}),
            Pet.deleteMany({}),
            Appointment.deleteMany({}),
            Inventory.deleteMany({}),
            require('../models/prescriptionModel').deleteMany({}),
            PetMedicalRecord.deleteMany({})
        ]);

        // 2. Create bcrypt hashes
        const adminPassword = await bcrypt.hash('admin123', 10);
        const doctorPassword = await bcrypt.hash('doctor123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        // 3. Insert one admin
        const admin = await Admin.create({
            username: 'admin',
            email: 'admin@PetEat.com',
            password: adminPassword,
            contact: '09999999999',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Insert one doctor
        const doctor = await Doctor.create({
            name: 'Dr. Vet',
            email: 'doctor@PetEat.com',
            password: doctorPassword,
            specialty: 'General',
            availability: 'available',
            role: 'doctor',
            contact: '09112223333',
            address: '456 Clinic Road',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 5. Insert one user
        const user = await User.create({
            username: 'petowner',
            email: 'user@PetEat.com',
            password: userPassword,
            role: 'pet owner',
            contactNumber: '09123456789',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 6. Insert one pet for the user
        const pet = await Pet.create({
            name: 'Buddy',
            type: 'dog',
            breed: 'Labrador',
            age: 4,
            weight: 25,
            color: 'Yellow',
            gender: 'male',
            owner: user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 7. Insert one EMR for the pet
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
            visitHistory: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Database reset and seeded.',
            credentials: {
                admin: { email: 'admin@PetEat.com', password: 'admin123' },
                doctor: { email: 'doctor@PetEat.com', password: 'doctor123' },
                user: { email: 'user@PetEat.com', password: 'user123' }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};