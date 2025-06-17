const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');

const authDoctor = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Find user by id - check both Doctor and User models
        let user = await Doctor.findById(decoded.id).select('-password');
        
        if (!user) {
            user = await User.findById(decoded.id).select('-password');
            if (!user || user.role !== 'doctor') {
                return res.status(401).json({
                    success: false,
                    message: 'Token is valid but user not found or not authorized as a doctor'
                });
            }
        }

        // Add user info to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = authDoctor;