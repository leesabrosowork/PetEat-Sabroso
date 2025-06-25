const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

const adminAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await Admin.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid or expired' });
    }
};

module.exports = adminAuth; 