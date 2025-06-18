const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Inventory = require('../models/inventoryModel');
const bcrypt = require('bcryptjs');
const VetClinic = require('../models/vetClinicModel');
const nodemailer = require('nodemailer');

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

        // Create new admin
        const admin = new Admin({
            username,
            email,
            password, // The model's pre-save middleware will hash this
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
        const { item, stock, minStock, category, status } = req.body;

        // Create new inventory item
        const newItem = await Inventory.create({
            item,
            stock,
            minStock,
            category,
            status: status || (stock > minStock ? 'in-stock' : 'low-stock')
        });

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        console.error('Inventory creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateInventoryItem = async (req, res) => {
    try {
        const { item, stock, minStock, category, status } = req.body;
        const itemId = req.params.id;

        const inventoryItem = await Inventory.findById(itemId);
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Update fields
        if (item) inventoryItem.item = item;
        if (stock !== undefined) inventoryItem.stock = stock;
        if (minStock !== undefined) inventoryItem.minStock = minStock;
        if (category) inventoryItem.category = category;
        // Don't override status - let middleware handle it based on stock levels
        // if (status) inventoryItem.status = status;

        await inventoryItem.save(); // This will trigger the middleware

        res.json({
            success: true,
            data: inventoryItem
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

// Increment or decrement inventory stock
exports.updateInventoryStock = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { amount } = req.body;
        if (typeof amount !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a number'
            });
        }
        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        item.stock += amount;
        if (item.stock < 0) item.stock = 0;
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

// Get all pending vet clinics
exports.getPendingVetClinics = async (req, res) => {
    try {
        const pendingClinics = await VetClinic.find({ status: 'pending' });
        res.json({
            success: true,
            data: pendingClinics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Approve a vet clinic
exports.approveVetClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const clinic = await VetClinic.findById(id);

        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: 'Vet clinic not found'
            });
        }

        clinic.status = 'approved';
        await clinic.save();

        // Send approval email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: clinic.email,
            subject: 'Your PetEat Veterinary Clinic Account Has Been Approved',
            text: `Dear ${clinic.ownerName},\n\nYour veterinary clinic account has been approved. You can now log in to your account and start using PetEat's services.\n\nBest regards,\nPetEat Team`
        });

        res.json({
            success: true,
            message: 'Vet clinic approved successfully',
            data: clinic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reject a vet clinic
exports.rejectVetClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const clinic = await VetClinic.findById(id);

        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: 'Vet clinic not found'
            });
        }

        clinic.status = 'rejected';
        clinic.rejectionReason = reason;
        await clinic.save();

        // Send rejection email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: clinic.email,
            subject: 'Your PetEat Veterinary Clinic Account Application Status',
            text: `Dear ${clinic.ownerName},\n\nWe regret to inform you that your veterinary clinic account application has been rejected.\n\nReason: ${reason}\n\nIf you believe this is an error or would like to provide additional information, please contact our support team.\n\nBest regards,\nPetEat Team`
        });

        res.json({
            success: true,
            message: 'Vet clinic rejected successfully',
            data: clinic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 