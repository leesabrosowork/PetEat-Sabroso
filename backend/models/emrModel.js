const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    visitDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    diagnosis: {
        type: String,
        required: true
    },
    treatment: {
        type: String,
        required: true
    },
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String
    }],
    notes: {
        type: String
    },
    followUpDate: {
        type: Date
    },
    attachments: [{
        type: String, // URLs to stored files
        description: String
    }],
    status: {
        type: String,
        enum: ['active', 'resolved', 'ongoing'],
        default: 'active'
    }
}, {
    timestamps: true
});

const EMR = mongoose.model('EMR', emrSchema);
module.exports = EMR; 