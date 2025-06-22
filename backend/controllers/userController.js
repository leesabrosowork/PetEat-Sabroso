const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');
const EMR = require('../models/emrModel');

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
            .sort({ startTime: 'desc' });
        const prescriptions = await Prescription.find({ user: userId })
            .populate('pet', 'name')
            .populate('medicine', 'item')
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

// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Start a transaction to ensure all operations succeed or fail together
        const session = await User.startSession();
        session.startTransaction();
        
        try {
            // Find user's pets first
            const pets = await Pet.find({ owner: userId });
            const petIds = pets.map(pet => pet._id);
            
            // Delete all EMRs related to the user's pets
            if (petIds.length > 0) {
                await EMR.deleteMany({ petId: { $in: petIds } }, { session });
            }
            
            // Delete all user's pets
            await Pet.deleteMany({ owner: userId }, { session });
            
            // Delete all user's appointments
            await Appointment.deleteMany({ user: userId }, { session });
            
            // Delete all user's prescriptions
            await Prescription.deleteMany({ user: userId }, { session });
            
            // Finally, delete the user account
            const deletedUser = await User.findByIdAndDelete(userId).session(session);
            
            if (!deletedUser) {
                // If user not found, abort transaction
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            
            res.json({
                success: true,
                message: 'Account and all associated data deleted successfully'
            });
        } catch (error) {
            // If any error occurs, abort the transaction
            await session.abortTransaction();
            session.endSession();
            throw error; // Re-throw for outer catch
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: error.message
        });
    }
};