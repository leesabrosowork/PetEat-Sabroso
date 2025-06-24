const Booking = require('../models/bookingModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');

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

        // Get available slots based on clinic operating hours
        const clinic = await User.findById(clinicId);
        if (!clinic) {
            return res.status(404).json({ success: false, message: 'Clinic not found' });
        }
        
        // Determine which hours to use
        const day = new Date(date).getDay();
        let hoursStr = '';
        if (day === 0) hoursStr = clinic.operatingHours.sunday;
        else if (day === 6) hoursStr = clinic.operatingHours.saturday;
        else hoursStr = clinic.operatingHours.mondayToFriday;
        
        // Debug logs
        console.log('ClinicId:', clinicId, 'Date:', date);
        console.log('Operating hours string:', hoursStr);
        
        if (!hoursStr || hoursStr.toLowerCase() === 'closed') {
            console.log('Clinic is closed on this day.');
            return res.json({ success: true, data: [] });
        }
        
        const [start, end] = hoursStr.split('-');
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        
        // Generate 30-min slots within the open hours
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
        
        console.log('Generated slots:', slots);
        
        // Double booking prevention: filter out slots that overlap with existing bookings for this clinic
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingBookings = await Booking.find({
            clinic: clinicId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: 'scheduled'
        });
        
        console.log('Existing bookings:', existingBookings);
        
        const availableSlots = slots.filter(slot => {
            return !existingBookings.some(booking => {
                const bookingStart = new Date(booking.startTime).getTime();
                const bookingEnd = new Date(booking.endTime).getTime();
                return (
                    (slot.startTime >= bookingStart && slot.startTime < bookingEnd) ||
                    (slot.endTime > bookingStart && slot.endTime <= bookingEnd) ||
                    (slot.startTime <= bookingStart && slot.endTime >= bookingEnd)
                );
            });
        });
        
        console.log('Available slots:', availableSlots);
        return res.json({ success: true, data: availableSlots });
    } catch (error) {
        console.error('Error in getAvailableTimeSlots:', error);
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
        console.log('Received booking data:', req.body);
        const { petId, clinicId, bookingDate, appointmentTime, reason } = req.body;

        // Validate required fields
        if (!petId || !clinicId || !bookingDate || !appointmentTime || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if pet exists and belongs to the user
        const pet = await Pet.findOne({ _id: petId, owner: req.user.id });
        if (!pet) {
            return res.status(400).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }

        // Create booking
        const bookingData = {
            petOwner: req.user.id,
            clinic: clinicId,
            pet: petId,
            bookingDate: new Date(bookingDate),
            appointmentTime,
            reason,
            status: 'pending'
        };

        console.log('Creating booking with data:', bookingData);

        const booking = new Booking(bookingData);
        await booking.save();

        // Populate the booking with pet and clinic details
        await booking.populate([
            { path: 'pet', select: 'name type breed' },
            { path: 'clinic', select: 'clinicName email' },
            { path: 'petOwner', select: 'fullName email' }
        ]);

        console.log('Booking created successfully:', booking);

        res.status(201).json({
            success: true,
            message: 'Booking scheduled successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error in createBooking:', error);
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
        const bookings = await Booking.find({ user: req.user.id })
            .populate('pet', 'name type breed')
            .populate('clinic', 'name email')
            .sort({ startTime: 'asc' });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error in getUserBookings:', error);
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
            .populate('clinic', 'clinicName email');
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error in getClinicBookings:', error);
        res.status(500).json({ success: false, message: 'Error fetching clinic bookings', error: error.message });
    }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('pet', 'name type breed')
            .populate('clinic', 'name email')
            .populate('user', 'username email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if the user is authorized to view this booking
        const isUser = booking.user._id.toString() === req.user.id;
        const isClinic = booking.clinic._id.toString() === req.user.id;

        if (!isUser && !isClinic) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error in getBookingById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
}; 