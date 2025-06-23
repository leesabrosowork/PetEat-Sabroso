const jwt = require('jsonwebtoken');
const Staff = require('../models/staffModel');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try to find the user in all possible models
            req.user =
                (await Staff.findById(decoded.id).select('-password')) ||
                (await Admin.findById(decoded.id).select('-password')) ||
                (await User.findById(decoded.id).select('-password'));

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

