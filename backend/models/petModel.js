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
        enum: ['male', 'female']
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
    medicalHistory: {
        type: String
    },
    allergies: {
        type: String
    },
    vaccinations: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Pet = mongoose.model('Pet', petSchema);
module.exports = Pet; 