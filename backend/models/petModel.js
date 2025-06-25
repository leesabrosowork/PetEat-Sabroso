const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'other']
    },
    breed: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    weight: {
        type: Number
    },
    color: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'unknown'],
        required: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    healthStatus: {
        type: String,
        enum: ['stable', 'checkup', 'critical'],
        default: 'stable'
    },
    medicalHistory: [{
        date: {
            type: Date,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        treatment: String,
        clinic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // Must have role: 'clinic'
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    }],
    allergies: {
        type: String
    },
    vaccinations: [{
        name: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        nextDueDate: Date,
        administeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    }],
    lastCheckup: {
        type: Date
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
petSchema.index({ owner: 1 });
petSchema.index({ healthStatus: 1 });
petSchema.index({ type: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ owner: 1, healthStatus: 1 });

const Pet = mongoose.model('Pet', petSchema);
module.exports = Pet; 