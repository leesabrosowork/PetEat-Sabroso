const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.requestOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
        });
        res.json({ success: true, message: 'OTP sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error sending OTP' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!user.otp || !user.otpExpires) return res.status(400).json({ success: false, message: 'No OTP requested' });
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
        
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        
        await user.save();
        res.json({ 
            success: true, 
            message: 'OTP verified successfully! You can now login to your account.',
            userType: 'pet_owner',
            requiresApproval: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error verifying OTP' });
    }
};

// Reset password with OTP
const bcrypt = require('bcryptjs');
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!user.otp || !user.otpExpires) return res.status(400).json({ success: false, message: 'No OTP requested' });
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
        user.password = newPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error resetting password' });
    }
};
