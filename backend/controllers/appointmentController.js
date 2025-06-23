const Appointment = require('../models/appointmentModel');
const Pet = require('../models/petModel');
const VetClinic = require('../models/vetClinicModel');

// Get all appointments for a specific date and clinic
const getAvailableTimeSlots = async (clinicId, date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for the clinic on this date
    const existingAppointments = await Appointment.find({
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
        return !existingAppointments.some(appointment => {
            const appointmentStart = new Date(appointment.startTime).getTime();
            const appointmentEnd = new Date(appointment.endTime).getTime();
            return (slot.startTime >= appointmentStart && slot.startTime < appointmentEnd) ||
                   (slot.endTime > appointmentStart && slot.endTime <= appointmentEnd);
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
        const clinic = await VetClinic.findById(clinicId);
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
        
        // Double booking prevention: filter out slots that overlap with existing appointments for this clinic
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingAppointments = await Appointment.find({
            clinic: clinicId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: 'scheduled'
        });
        
        console.log('Existing appointments:', existingAppointments);
        
        const availableSlots = slots.filter(slot => {
            return !existingAppointments.some(app => {
                const appStart = new Date(app.startTime).getTime();
                const appEnd = new Date(app.endTime).getTime();
                return (
                    (slot.startTime >= appStart && slot.startTime < appEnd) ||
                    (slot.endTime > appStart && slot.endTime <= appEnd) ||
                    (slot.startTime <= appStart && slot.endTime >= appEnd)
                );
            });
        });
        
        console.log('Available slots:', availableSlots);
        return res.json({ success: true, data: availableSlots });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
    try {
        console.log('Received appointment data:', req.body);
        const { petId, clinicId, startTime, endTime, type, notes } = req.body;

        // Log the parsed values
        console.log('Parsed values:', {
            petId, clinicId, startTime, endTime, type, notes,
            userId: req.user?.id
        });

        // Validate required fields
        if (!petId || !clinicId || !startTime || !endTime || !type) {
            console.log('Missing required fields:', {
                hasPetId: !!petId,
                hasClinicId: !!clinicId,
                hasStartTime: !!startTime,
                hasEndTime: !!endTime,
                hasType: !!type
            });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if pet exists and belongs to the user
        const pet = await Pet.findOne({ _id: petId, owner: req.user.id });
        if (!pet) {
            console.log('Pet not found or does not belong to user:', {
                petId,
                userId: req.user.id
            });
            return res.status(400).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }

        // Convert timestamp strings to Date objects
        console.log('Converting timestamps:', { startTime, endTime });
        const appointmentStartTime = new Date(parseInt(startTime));
        const appointmentEndTime = new Date(parseInt(endTime));

        // Validate that the dates are valid
        if (isNaN(appointmentStartTime.getTime()) || isNaN(appointmentEndTime.getTime())) {
            console.log('Invalid dates:', {
                startTime: appointmentStartTime,
                endTime: appointmentEndTime
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment times provided'
            });
        }

        // Create appointment
        const appointmentData = {
            pet: petId,
            user: req.user.id,
            clinic: clinicId,
            startTime: appointmentStartTime,
            endTime: appointmentEndTime,
            type,
            notes: notes || ''
        };

        console.log('Creating appointment with data:', appointmentData);

        const appointment = new Appointment(appointmentData);
        await appointment.save();

        // Populate the appointment with pet details
        await appointment.populate([
            { path: 'pet', select: 'name type breed' },
            { path: 'clinic', select: 'name email' }
        ]);

        console.log('Appointment created successfully:', appointment);

        res.status(201).json({
            success: true,
            message: 'Appointment scheduled successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Appointment creation error:', error);
        console.error('Error stack:', error.stack);
        
        // Handle double booking error specifically
        if (error.message === 'This time slot is already booked') {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating appointment',
            error: error.message
        });
    }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ user: req.user.id })
            .populate('pet', 'name type breed')
            .populate('clinic', 'name email')
            .sort({ startTime: 'asc' });

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments',
            error: error.message
        });
    }
};

// Get all appointments for the authenticated clinic
exports.getClinicAppointments = async (req, res) => {
    try {
        const clinicId = req.user.id;
        const appointments = await Appointment.find({ clinic: clinicId })
            .populate('pet', 'name')
            .populate('user', 'name email');
        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching clinic appointments', error: error.message });
    }
};

// Get a single appointment by ID
exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('pet', 'name type breed')
            .populate('clinic', 'name email')
            .populate('user', 'username email');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if the user is authorized to view this appointment
        const isUser = appointment.user._id.toString() === req.user.id;
        const isClinic = appointment.clinic._id.toString() === req.user.id;

        if (!isUser && !isClinic) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this appointment'
            });
        }

        res.json({
            success: true,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment',
            error: error.message
        });
    }
}; 