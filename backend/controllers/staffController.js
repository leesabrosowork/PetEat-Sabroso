const Staff = require('../models/staffModel');
const Inventory = require('../models/inventoryModel');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register new staff
// @route   POST /api/staff
// @access  Public
exports.registerStaff = async (req, res) => {
    try {
        const { name, email, password, contact, address } = req.body;

        // Check if staff exists
        const staffExists = await Staff.findOne({ email });
        if (staffExists) {
            return res.status(400).json({
                success: false,
                message: 'Staff already exists'
            });
        }

        // Create staff
        const staff = await Staff.create({
            name,
            email,
            password,
            contact,
            address
        });

        if (staff) {
            res.status(201).json({
                success: true,
                data: {
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    contact: staff.contact,
                    address: staff.address,
                    token: generateToken(staff._id)
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering staff',
            error: error.message
        });
    }
};

// @desc    Auth staff & get token
// @route   POST /api/staff/login
// @access  Public
exports.loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for staff email
        const staff = await Staff.findOne({ email });
        if (!staff) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await staff.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        res.json({
            success: true,
            data: {
                _id: staff._id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                contact: staff.contact,
                address: staff.address,
                token: generateToken(staff._id)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Get all inventory items
// @route   GET /api/staff/inventory
// @access  Private/Staff
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory',
            error: error.message
        });
    }
};

// @desc    Update inventory stock
// @route   PATCH /api/staff/inventory/:id/stock
// @access  Private/Staff
exports.updateInventoryStock = async (req, res) => {
    try {
        const { amount } = req.body;
        if (typeof amount !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a number'
            });
        }
        
        const inventory = await Inventory.findById(req.params.id);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Update stock
        inventory.stock += amount;
        if (inventory.stock < 0) inventory.stock = 0;
        
        await inventory.save();

        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating inventory',
            error: error.message
        });
    }
};

// @desc    Get staff profile
// @route   GET /api/staff/profile
// @access  Private/Staff
exports.getStaffProfile = async (req, res) => {
    try {
        const staff = await Staff.findById(req.user.id).select('-password');
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching staff profile',
            error: error.message
        });
    }
}; 