const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['checkup', 'vaccination', 'consultation', 'surgery', 'emergency']
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

// Middleware to prevent double booking
appointmentSchema.pre('save', async function(next) {
    const overlapping = await this.constructor.findOne({
        doctor: this.doctor,
        status: 'scheduled',
        $or: [
            {
                startTime: { $lt: this.endTime },
                endTime: { $gt: this.startTime }
            }
        ]
    });

    if (overlapping && (!this.id || !overlapping.id.equals(this.id))) {
        throw new Error('This time slot is already booked');
    }
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment; 