const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdminModel');

const superAdminAuth = async (req, res, next) => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await SuperAdmin.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Super admin not found' 
            });
        }

        // Check if user is super admin
        if (user.role !== 'super admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Super admin privileges required.' 
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('[SUPER-ADMIN-AUTH] Error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is invalid or expired' 
        });
    }
};

module.exports = superAdminAuth; 