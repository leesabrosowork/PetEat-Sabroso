const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    petOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Must have role: 'clinic'
        required: true
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    type: {
        type: String,
        enum: ['consultation', 'checkup', 'surgery'],
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    googleMeetLink: {
        type: String
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index to accelerate clinic/day lookups and prevent duplicates
bookingSchema.index({ clinic: 1, bookingDate: 1, appointmentTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 