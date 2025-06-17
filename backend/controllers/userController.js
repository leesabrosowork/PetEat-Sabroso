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