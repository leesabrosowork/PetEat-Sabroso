const jwt = require('jsonwebtoken');
const Doctor = require('../models/doctorModel');
const User = require('../models/userModel');

const doctorAuth = async (req, res, next) => {
    try {
        // Debug: Log the incoming Authorization header
        console.log('[doctorAuth] Incoming Authorization header:', req.header('Authorization'));

        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // Debug: Log the extracted token
        console.log('[doctorAuth] Extracted token:', token);

        if (!token) {
            console.log('[doctorAuth] No token found in Authorization header.');
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        let decoded;
        try {
            // Verify token
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[doctorAuth] Decoded token:', decoded);
        } catch (jwtErr) {
            console.log('[doctorAuth] JWT verification failed:', jwtErr.message);
            return res.status(401).json({
                success: false,
                message: 'Token is not valid',
                error: jwtErr.message
            });
        }
        
        // Find user by id - check both Doctor and User models
        let user = await Doctor.findById(decoded.id);
        console.log('[doctorAuth] Doctor.findById result:', user);
        
        if (!user) {
            // If not found in Doctor model, check User model
            user = await User.findById(decoded.id);
            console.log('[doctorAuth] User.findById result:', user);
            
            // If found in User model, ensure they have doctor role
            if (user && user.role !== 'doctor') {
                console.log('[doctorAuth] User found but role is not doctor:', user.role);
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized as a doctor'
                });
            }
        }

        if (!user) {
            console.log('[doctorAuth] Token valid but user not found or not authorized as a doctor.');
            return res.status(401).json({
                success: false,
                message: 'Token is valid but user not found or not authorized as a doctor'
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (err) {
        console.log('[doctorAuth] General error:', err.message);
        res.status(401).json({
            success: false,
            message: 'Token is not valid',
            error: err.message
        });
    }
};

module.exports = { doctorAuth }; 