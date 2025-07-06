const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Inventory = require('../models/inventoryModel');
const bcrypt = require('bcryptjs');
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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('admins_updated');
        }

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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('admins_updated');
        }

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
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('admins_updated');
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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
        }

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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
        }

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
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('pets_updated');
        }

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

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('pets_updated');
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

exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findByIdAndDelete(req.params.id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('pets_updated');
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
        const { item, category, stock, minStock, clinic, expirationDate, manufacturingDate } = req.body;

        // Create new inventory item
        const newItem = await Inventory.create({
            item,
            category,
            stock,
            minStock,
            status: stock > minStock ? 'in-stock' : 'low-stock',
            clinic,
            expirationDate,
            manufacturingDate
        });

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item, category, stock, minStock, expirationDate, manufacturingDate } = req.body;

        const inventoryItem = await Inventory.findById(id);
        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        // Update fields
        if (item) inventoryItem.item = item;
        if (category) inventoryItem.category = category;
        if (stock !== undefined) inventoryItem.stock = stock;
        if (minStock !== undefined) inventoryItem.minStock = minStock;
        if (expirationDate) inventoryItem.expirationDate = expirationDate;
        if (manufacturingDate) inventoryItem.manufacturingDate = manufacturingDate;

        await inventoryItem.save(); // This will trigger the middleware

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
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
        const { amount, userId } = req.body; // Optionally track who made the change
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
        // Track subtraction history
        if (!item.subtractionHistory) item.subtractionHistory = [];
        if (amount < 0) {
            item.subtractionHistory.push({
                amount,
                date: new Date(),
                user: userId || null
            });
        }
        await item.save();
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
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

// Get all pending vet clinics
exports.getPendingVetClinics = async (req, res) => {
    try {
        const pendingClinics = await User.find({ role: 'clinic', status: 'pending' });
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
        const clinic = await User.findById(id);

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
            text: `Your veterinary clinic account has been approved. You can now log in to your account and start using PetEat's services.\n\nBest regards,\nPetEat Team`
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

        const clinic = await User.findById(id);

        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: 'Vet clinic not found'
            });
        }

        // Send rejection email before deleting
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
            text: `We regret to inform you that your veterinary clinic account application has been rejected.\n\nReason: ${reason}\n\nIf you believe this is an error or would like to provide additional information, please contact our support team.\n\nBest regards,\nPetEat Team`
        });

        // Delete the clinic user from the database
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Vet clinic rejected and account deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Dashboard overview for super admin
exports.getDashboardOverview = async (req, res) => {
    try {
        const analyticsYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const yearStart = new Date(Date.UTC(analyticsYear, 0, 1, 0, 0, 0));
        const yearEnd = new Date(Date.UTC(analyticsYear + 1, 0, 1, 0, 0, 0));
        const [
            userCount,
            adminCount,
            vetClinicCount,
            petCount,
            inventoryCount,
            lowStockItems
        ] = await Promise.all([
            User.countDocuments(),
            Admin.countDocuments(),
            User.countDocuments({ role: 'clinic' }),
            Pet.countDocuments(),
            Inventory.countDocuments(),
            Inventory.countDocuments({
                $or: [
                    { status: 'low-stock' },
                    { status: 'out-of-stock' }
                ]
            })
        ]);
        // --- Analytics Section (similar to vetClinicController, but for all clinics) ---
        // Appointments by reason by month (all clinics)
        const Booking = require('../models/bookingModel');
        const allBookings = await Booking.find({
            bookingDate: { $gte: yearStart, $lt: yearEnd },
            status: { $in: ['confirmed', 'completed'] }
        });
        const appointmentsByReasonByMonth = {};
        for (let i = 0; i < 12; i++) {
            const monthBookings = allBookings.filter(b => {
                const d = new Date(b.bookingDate);
                return d.getUTCMonth() === i;
            });
            for (const b of monthBookings) {
                if (!b.reason) continue;
                if (!appointmentsByReasonByMonth[b.reason]) appointmentsByReasonByMonth[b.reason] = Array(12).fill(0);
                appointmentsByReasonByMonth[b.reason][i]++;
            }
        }
        // Inventory changes by month (all clinics)
        const inventoryDocsYear = await Inventory.find({
            $or: [
                { expirationDate: { $gte: yearStart, $lt: yearEnd } },
                { 'subtractionHistory.date': { $gte: yearStart, $lt: yearEnd } },
                { createdAt: { $gte: yearStart, $lt: yearEnd } },
                { updatedAt: { $gte: yearStart, $lt: yearEnd } }
            ]
        });
        const inventoryChangesByMonth = {
            expired: Array(12).fill(0),
            subtracted: Array(12).fill(0),
            added: Array(12).fill(0),
            removed: Array(12).fill(0)
        };
        for (let i = 0; i < 12; i++) {
            // Expired
            inventoryChangesByMonth.expired[i] = inventoryDocsYear.filter(inv => inv.expirationDate && (new Date(inv.expirationDate)).getUTCMonth() === i && (new Date(inv.expirationDate)).getUTCFullYear() === analyticsYear).length;
            // Added (created)
            inventoryChangesByMonth.added[i] = inventoryDocsYear.filter(inv => inv.createdAt && (new Date(inv.createdAt)).getUTCMonth() === i && (new Date(inv.createdAt)).getUTCFullYear() === analyticsYear).length;
            // Removed (deleted) - not tracked unless you have a deletion log, so leave as 0
            inventoryChangesByMonth.removed[i] = 0;
            // Subtracted (from subtractionHistory)
            let subCount = 0;
            for (const inv of inventoryDocsYear) {
                if (Array.isArray(inv.subtractionHistory)) {
                    for (const sub of inv.subtractionHistory) {
                        const d = new Date(sub.date);
                        if (d.getUTCMonth() === i && d.getUTCFullYear() === analyticsYear) {
                            subCount++;
                        }
                    }
                }
            }
            inventoryChangesByMonth.subtracted[i] = subCount;
        }
        // Pets admitted & status changes by month (all clinics)
        const PetsUnderTreatment = require('../models/petsUnderTreatmentModel');
        const petsUnderTreatmentYear = await PetsUnderTreatment.find({
            admissionDate: { $gte: yearStart, $lt: yearEnd }
        });
        const petsAdmittedByMonth = Array(12).fill(0);
        const petsStatusChangesByMonth = {
            Critical: Array(12).fill(0),
            Stable: Array(12).fill(0),
            Improving: Array(12).fill(0),
            Recovered: Array(12).fill(0)
        };
        for (const pet of petsUnderTreatmentYear) {
            // Count admissions
            const adm = new Date(pet.admissionDate);
            if (adm.getUTCFullYear() === analyticsYear) {
                petsAdmittedByMonth[adm.getUTCMonth()]++;
            }
            // Count status changes from treatmentHistory
            if (Array.isArray(pet.treatmentHistory)) {
                for (const hist of pet.treatmentHistory) {
                    if (hist.date) {
                        const d = new Date(hist.date);
                        if (d.getUTCFullYear() === analyticsYear) {
                            for (const status of ["Critical","Stable","Improving","Recovered"]) {
                                if (hist.notes && hist.notes.toLowerCase().includes(status.toLowerCase())) {
                                    petsStatusChangesByMonth[status][d.getUTCMonth()]++;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Most subtracted inventory item (by amount) for the year
        let mostSubtractedItem = null;
        let mostSubtractedItemAmount = 0;
        const subtractedByItem = {};
        for (const inv of inventoryDocsYear) {
            if (!inv.item) continue;
            const totalSub = (inv.subtractionHistory || [])
                .filter(h => h.amount < 0 && h.date && (new Date(h.date)).getUTCFullYear() === analyticsYear)
                .reduce((sum, h) => sum + Math.abs(h.amount), 0);
            if (!subtractedByItem[inv.item]) subtractedByItem[inv.item] = 0;
            subtractedByItem[inv.item] += totalSub;
        }
        for (const [item, amt] of Object.entries(subtractedByItem)) {
            if (amt > mostSubtractedItemAmount) {
                mostSubtractedItem = item;
                mostSubtractedItemAmount = amt;
            }
        }
        // Top 5 most subtracted items
        const topSubtractedItems = Object.entries(subtractedByItem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([item, amount]) => ({ item, amount }));

        // --- New: Top 5 most subtracted items by month (12-month analytics) ---
        const topSubtractedItemsByMonth = topSubtractedItems.map(({ item }) => {
            const monthly = Array(12).fill(0);
            for (const inv of inventoryDocsYear) {
                if (inv.item !== item) continue;
                if (Array.isArray(inv.subtractionHistory)) {
                    for (const sub of inv.subtractionHistory) {
                        if (sub.amount < 0 && sub.date) {
                            const d = new Date(sub.date);
                            if (d.getUTCFullYear() === analyticsYear) {
                                monthly[d.getUTCMonth()] += Math.abs(sub.amount);
                            }
                        }
                    }
                }
            }
            return { item, monthly };
        });
        // Inventory analytics: find the category with the most subtracted
        const subtractedByCategory = {};
        for (const inv of inventoryDocsYear) {
            if (!inv.category) continue;
            const totalSub = (inv.subtractionHistory || [])
                .filter(h => h.amount < 0)
                .reduce((sum, h) => sum + Math.abs(h.amount), 0);
            if (!subtractedByCategory[inv.category]) subtractedByCategory[inv.category] = 0;
            subtractedByCategory[inv.category] += totalSub;
        }
        let mostSubtractedCategory = null;
        let mostSubtractedAmount = 0;
        for (const [cat, amt] of Object.entries(subtractedByCategory)) {
            if (amt > mostSubtractedAmount) {
                mostSubtractedCategory = cat;
                mostSubtractedAmount = amt;
            }
        }
        // Pets by status (all clinics)
        const allPets = await Pet.find();
        const petsByStatus = {
            stable: allPets.filter(pet => pet.healthStatus === 'stable').length,
            checkup: allPets.filter(pet => pet.healthStatus === 'checkup').length,
            critical: allPets.filter(pet => pet.healthStatus === 'critical').length
        };
        res.json({
            success: true,
            data: {
                userCount,
                adminCount,
                vetClinicCount,
                petCount,
                inventoryCount,
                lowStockItems,
                mostSubtractedCategory,
                mostSubtractedAmount,
                appointmentsByReasonByMonth,
                inventoryChangesByMonth,
                petsAdmittedByMonth,
                petsStatusChangesByMonth,
                mostSubtractedItem,
                mostSubtractedItemAmount,
                topSubtractedItems,
                topSubtractedItemsByMonth, // <-- Add this to the response
                petsByStatus
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 