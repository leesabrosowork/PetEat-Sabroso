const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    contact: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        default: 'doctor'
    },
    address: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    availability: {
        type: String,
        enum: ['available', 'not available'],
        default: 'available'
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }]
}, {
    timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor; 