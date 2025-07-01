const mongoose = require('mongoose');

const petsUnderTreatmentSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Must have role: 'clinic'
        required: true
    },
    status: {
        type: String,
        enum: ['Critical', 'Stable', 'Improving', 'Recovered'],
        default: 'Stable'
    },
    room: {
        type: String,
        required: true
    },
    admissionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    clinicalNotes: {
        type: String,
        default: ''
    },
    treatmentHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            required: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    diagnosis: {
        type: String,
        default: ''
    },
    expectedDischargeDate: {
        type: Date
    },
    discharged: {
        type: Boolean,
        default: false
    },
    dischargedDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Update lastUpdated timestamp before save
petsUnderTreatmentSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

const PetsUnderTreatment = mongoose.model('PetsUnderTreatment', petsUnderTreatmentSchema);
module.exports = PetsUnderTreatment; 