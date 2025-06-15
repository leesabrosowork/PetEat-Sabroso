const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        const { username, email, password, contactNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { contactNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 
                    'Email already in use' : 
                    'Contact number already in use'
            });
        }

        // Create new user with default role of 'pet owner'
        const newUser = await User.create({
            username,
            email,
            password, // Will be hashed by the pre-save middleware
            contactNumber,
            role: 'pet owner'
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Remove password from response
        newUser.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Signup successful',
            data: { user: newUser, role: 'user', token }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Try to find the user in each model
        const user = await User.findOne({ email }).select('+password');
        const doctor = await Doctor.findOne({ email }).select('+password');
        const admin = await Admin.findOne({ email }).select('+password');
        const staff = await Staff.findOne({ email }).select('+password');

        console.log('Found user:', user ? 'Yes' : 'No');
        console.log('Found doctor:', doctor ? 'Yes' : 'No');
        console.log('Found admin:', admin ? 'Yes' : 'No');
        console.log('Found staff:', staff ? 'Yes' : 'No');

        let authenticatedUser = null;
        let role = '';

        // Check which type of user was found
        if (user) {
            console.log('Checking user password...');
            const isPasswordValid = await bcrypt.compare(password, user.password);
            console.log('User password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = user;
                role = 'user';
            }
        } else if (doctor) {
            console.log('Checking doctor password...');
            const isPasswordValid = await bcrypt.compare(password, doctor.password);
            console.log('Doctor password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = doctor;
                role = 'doctor';
            }
        } else if (admin) {
            console.log('Checking admin password...');
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            console.log('Admin password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = admin;
                role = 'admin';
            }
        } else if (staff) {
            console.log('Checking staff password...');
            const isPasswordValid = await bcrypt.compare(password, staff.password);
            console.log('Staff password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = staff;
                role = 'staff';
            }
        }

        if (!authenticatedUser) {
            console.log('No authenticated user found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: authenticatedUser._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Remove password from response
        authenticatedUser.password = undefined;

        console.log('Login successful for role:', role);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: authenticatedUser, role, token }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 