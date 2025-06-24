const Booking = require('../models/bookingModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');

function fallback(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    return value;
}

// Get all bookings for a specific date and clinic
const getAvailableTimeSlots = async (clinicId, date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for the clinic on this date
    const existingBookings = await Booking.find({
        clinic: clinicId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'scheduled'
    });

    // Define all possible time slots (9 AM to 5 PM, 1-hour slots)
    const allTimeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
        allTimeSlots.push({
            startTime: new Date(date).setHours(hour, 0, 0, 0),
            endTime: new Date(date).setHours(hour + 1, 0, 0, 0)
        });
    }

    // Filter out booked slots
    return allTimeSlots.filter(slot => {
        return !existingBookings.some(booking => {
            const bookingStart = new Date(booking.startTime).getTime();
            const bookingEnd = new Date(booking.endTime).getTime();
            return (slot.startTime >= bookingStart && slot.startTime < bookingEnd) ||
                   (slot.endTime > bookingStart && slot.endTime <= bookingEnd);
        });
    });
};

// Get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { clinicId, date } = req.query;
        if (!clinicId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Clinic ID and date are required'
            });
        }
        const clinic = await User.findById(clinicId);
        if (!clinic) {
            return res.status(404).json({ success: false, message: 'Clinic not found' });
        }
        const day = new Date(date).getDay();
        let hoursStr = '';
        if (day === 0) hoursStr = clinic.operatingHours?.sunday;
        else if (day === 6) hoursStr = clinic.operatingHours?.saturday;
        else hoursStr = clinic.operatingHours?.mondayToFriday;
        if (!hoursStr || hoursStr.toLowerCase() === 'closed') {
            return res.json({ success: true, data: [] });
        }
        const [start, end] = hoursStr.split('-');
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const slots = [];
        let current = new Date(date);
        current.setHours(sh, sm, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(eh, em, 0, 0);
        while (current < endTime) {
            const slotStart = new Date(current);
            current.setMinutes(current.getMinutes() + 30);
            const slotEnd = new Date(current);
            slots.push({ startTime: slotStart.getTime(), endTime: slotEnd.getTime() });
        }
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const existingBookings = await Booking.find({
            clinic: clinicId,
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'confirmed', 'scheduled'] }
        });
        const availableSlots = slots.filter(slot => {
            return !existingBookings.some(booking => {
                const [hours, minutes] = booking.appointmentTime.split(':');
                const bookingStart = new Date(booking.bookingDate);
                bookingStart.setHours(Number(hours), Number(minutes), 0, 0);
                const bookingEnd = new Date(bookingStart);
                bookingEnd.setMinutes(bookingEnd.getMinutes() + 30);
                return (
                    (slot.startTime >= bookingStart.getTime() && slot.startTime < bookingEnd.getTime()) ||
                    (slot.endTime > bookingStart.getTime() && slot.endTime <= bookingEnd.getTime()) ||
                    (slot.startTime <= bookingStart.getTime() && slot.endTime >= bookingEnd.getTime())
                );
            });
        });
        return res.json({ success: true, data: availableSlots });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const { petId, clinicId, bookingDate, appointmentTime, reason, type } = req.body;
        if (!petId || !clinicId || !bookingDate || !appointmentTime || !reason || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        if (!['consultation', 'checkup', 'surgery'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment type'
            });
        }
        const pet = await Pet.findOne({ _id: petId, owner: req.user.id });
        if (!pet) {
            return res.status(400).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }
        const bookingData = {
            petOwner: req.user.id,
            clinic: clinicId,
            pet: petId,
            bookingDate: new Date(bookingDate),
            appointmentTime,
            reason,
            type,
            status: 'pending'
        };
        const booking = new Booking(bookingData);
        await booking.save();
        await booking.populate([
            { path: 'pet', select: 'name type breed' },
            { path: 'clinic', select: 'clinicName email' },
            { path: 'petOwner', select: 'fullName email' }
        ]);
        res.status(201).json({
            success: true,
            message: 'Booking scheduled successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ petOwner: req.user.id })
            .populate('pet', 'name type breed')
            .populate('clinic', 'clinicName email')
            .sort({ bookingDate: 1, appointmentTime: 1 });
        const transformed = bookings.map(b => {
            let startTime = 'N/A';
            if (b.bookingDate && b.appointmentTime) {
                const date = new Date(b.bookingDate);
                const [hours, minutes] = b.appointmentTime.split(':');
                date.setHours(Number(hours), Number(minutes), 0, 0);
                startTime = date.toISOString();
            }
            return {
                _id: b._id,
                pet: b.pet,
                clinic: b.clinic || 'N/A',
                startTime,
                status: fallback(b.status),
                notes: fallback(b.reason),
            };
        });
        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

// Get all bookings for the authenticated clinic
exports.getClinicBookings = async (req, res) => {
    try {
        const clinicId = req.user.id;
        const bookings = await Booking.find({ clinic: clinicId })
            .populate('pet', 'name type breed')
            .populate('petOwner', 'fullName email')
            .populate('clinic', 'clinicName email')
            .sort({ bookingDate: 1, appointmentTime: 1 });
        const transformed = bookings.map(b => {
            let startTime = 'N/A';
            if (b.bookingDate && b.appointmentTime) {
                const date = new Date(b.bookingDate);
                const [hours, minutes] = b.appointmentTime.split(':');
                date.setHours(Number(hours), Number(minutes), 0, 0);
                startTime = date.toISOString();
            }
            return {
                _id: b._id,
                pet: b.pet,
                petOwner: b.petOwner || 'N/A',
                startTime,
                status: fallback(b.status),
                notes: fallback(b.reason),
            };
        });
        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching clinic bookings', error: error.message });
    }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('pet', 'name type breed')
            .populate('clinic', 'clinicName email')
            .populate('petOwner', 'fullName email');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        // Check if the user is authorized to view this booking
        const isUser = booking.petOwner && booking.petOwner._id.toString() === req.user.id;
        const isClinic = booking.clinic && booking.clinic._id.toString() === req.user.id;
        if (!isUser && !isClinic) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }
        // Populate with fallback for missing info
        const result = {
            _id: booking._id,
            pet: booking.pet || 'N/A',
            clinic: booking.clinic || 'N/A',
            petOwner: booking.petOwner || 'N/A',
            bookingDate: booking.bookingDate || 'N/A',
            appointmentTime: booking.appointmentTime || 'N/A',
            reason: fallback(booking.reason),
            status: fallback(booking.status),
            notes: fallback(booking.notes),
            createdAt: booking.createdAt || 'N/A',
        };
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
}; 