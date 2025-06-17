const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');

// Create new user
exports.createUser = async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        // Don't send password in response
        newUser.password = undefined;
        res.status(201).json({
            status: 'success',
            data: {
                user: newUser
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
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
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

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
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

// Get user's pets
exports.getUserPets = async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.id });
        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pets',
            error: error.message
        });
    }
};

// Get user dashboard data
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validate that the logged-in user is requesting their own data
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this dashboard'
            });
        }

        const pets = await Pet.find({ owner: userId });
        const appointments = await Appointment.find({ user: userId })
            .populate('doctor', 'name email')
            .sort({ startTime: 'desc' });
        const prescriptions = await Prescription.find({ user: userId })
            .populate('pet', 'name')
            .populate('doctor', 'name')
            .populate('medicine', 'name')
            .sort({ createdAt: 'desc' });

        res.json({
            success: true,
            data: {
                pets,
                appointments,
                prescriptions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};