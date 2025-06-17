const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');

const auth = async (req, res, next) => {
    try {
        console.log('[AUTH] Checking Authorization header...');
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('[AUTH] Token:', token);

        if (!token) {
            console.log('[AUTH] No token found!');
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            console.log('[AUTH] Token decoded:', decoded);
        } catch (err) {
            console.log('[AUTH] Token verification failed:', err.message);
            return res.status(401).json({
                success: false,
                message: 'Token is not valid (verification failed)'
            });
        }
        
        // Find user by id in users collection
        let foundUser = await User.findById(decoded.id).select('-password');
        if (!foundUser) {
            // Try doctors collection if not found in users
            foundUser = await Doctor.findById(decoded.id).select('-password');
            if (foundUser) {
                foundUser.role = 'doctor'; // Ensure role is set
            }
        }
        console.log('[AUTH] User/Doctor found:', foundUser);
        
        if (!foundUser) {
            console.log('[AUTH] Token valid but user/doctor not found in DB!');
            return res.status(401).json({
                success: false,
                message: 'Token is valid but user/doctor not found'
            });
        }

        // Add user info to request
        req.user = foundUser;
        console.log('[AUTH] Auth successful, req.user set.');
        next();
    } catch (error) {
        console.log('[AUTH] General error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Token is not valid (general error)'
        });
    }
};

module.exports = auth; 