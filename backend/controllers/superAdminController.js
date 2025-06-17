const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Inventory = require('../models/inventoryModel');
const bcrypt = require('bcryptjs');

// Admin Management
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.json({
            success: true,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, contact } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
            contact,
            role: 'admin'
        });

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            success: true,
            data: adminResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const { username, email, password, contact, status } = req.body;
        const adminId = req.params.id;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Update fields
        if (username) admin.username = username;
        if (email) admin.email = email;
        if (contact) admin.contact = contact;
        if (status) admin.status = status;
        
        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
        }

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.json({
            success: true,
            data: adminResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Doctor Management
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json({
            success: true,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('-password');
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }
        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createDoctor = async (req, res) => {
    try {
        const { name, email, password, contact, specialty, availability } = req.body;
        
        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            contact,
            specialty,
            availability,
            role: 'doctor'
        });

        await doctor.save();

        // Remove password from response
        const doctorResponse = doctor.toObject();
        delete doctorResponse.password;

        res.status(201).json({
            success: true,
            data: doctorResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const { name, email, password, contact, specialty, availability, status } = req.body;
        const doctorId = req.params.id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Update fields
        if (name) doctor.name = name;
        if (email) doctor.email = email;
        if (contact) doctor.contact = contact;
        if (specialty) doctor.specialty = specialty;
        if (availability) doctor.availability = availability;
        if (status) doctor.status = status;
        
        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            doctor.password = await bcrypt.hash(password, salt);
        }

        await doctor.save();

        // Remove password from response
        const doctorResponse = doctor.toObject();
        delete doctorResponse.password;

        res.json({
            success: true,
            data: doctorResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }
        res.json({
            success: true,
            message: 'Doctor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// User Management
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, contactNumber } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            contactNumber,
            role: 'user'
        });

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, contactNumber, status } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (contactNumber) user.contactNumber = contactNumber;
        if (status) user.status = status;
        
        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Pet Management
exports.getAllPets = async (req, res) => {
    try {
        const pets = await Pet.find().populate('owner', 'username email');
        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getPetById = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id).populate('owner', 'username email');
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createPet = async (req, res) => {
    try {
        const { name, type, breed, age, owner } = req.body;

        // Create new pet
        const pet = new Pet({
            name,
            type,
            breed,
            age,
            owner
        });

        await pet.save();

        res.status(201).json({
            success: true,
            data: pet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updatePet = async (req, res) => {
    try {
        const { name, type, breed, age, owner } = req.body;
        const petId = req.params.id;

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Update fields
        if (name) pet.name = name;
        if (type) pet.type = type;
        if (breed) pet.breed = breed;
        if (age) pet.age = age;
        if (owner) pet.owner = owner;

        await pet.save();

        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findByIdAndDelete(req.params.id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Inventory Management
exports.getAllInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getInventoryItemById = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createInventoryItem = async (req, res) => {
    try {
        const { name, quantity, category, status } = req.body;

        // Create new inventory item
        const item = new Inventory({
            name,
            quantity,
            category,
            status
        });

        await item.save();

        res.status(201).json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateInventoryItem = async (req, res) => {
    try {
        const { name, quantity, category, status } = req.body;
        const itemId = req.params.id;

        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Update fields
        if (name) item.name = name;
        if (quantity) item.quantity = quantity;
        if (category) item.category = category;
        if (status) item.status = status;

        await item.save();

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 