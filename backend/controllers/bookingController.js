// Placeholder Booking Controller

const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Pet = require('../models/petModel');

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
        
        if (!hoursStr || hoursStr.toLowerCase() === 'closed') {
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
        
        // Double booking prevention: filter out slots that overlap with existing bookings for this clinic
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingBookings = await Booking.find({
            clinic: clinicId,
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'scheduled'
        });
        
        const availableSlots = slots.filter(slot => {
            return !existingBookings.some(booking => {
                // Combine bookingDate and appointmentTime to get booking start/end
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
        console.error('Error in getAvailableTimeSlots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
};

exports.createBooking = async (req, res) => {
  try {
    const { petId, clinicId, bookingDate, appointmentTime, reason, type } = req.body;
    console.log('📝 Creating booking with data:', { petId, clinicId, bookingDate, appointmentTime, reason, type });
    console.log('📝 Clinic ID type:', typeof clinicId);
    
    if (!petId || !clinicId || !bookingDate || !appointmentTime || !reason || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    if (!['in person', 'online'].includes(type)) {
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
    console.log('📝 Booking data to save:', bookingData);
    
    const booking = new Booking(bookingData);
    await booking.save();
    console.log('✅ Booking saved with ID:', booking._id);
    console.log('✅ Booking clinic field:', booking.clinic);
    
    await booking.populate([
      { path: 'pet', select: 'name type breed' },
      { path: 'clinic', select: 'clinicName email' },
      { path: 'petOwner', select: 'fullName email' }
    ]);
    // Emit socket event for real-time updates
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('bookings_updated');
    }
    res.status(201).json({
      success: true,
      message: 'Booking scheduled successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

exports.getUserBookings = (req, res) => {
  res.json({ message: 'getUserBookings called' });
};

exports.getClinicBookings = (req, res) => {
  res.json({ message: 'getClinicBookings called' });
};

exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId)
      .populate('pet', 'name breed species age gender')
      .populate('petOwner', 'fullName name email contactNumber')
      .populate('clinic', 'clinicName email contactNumber address');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Transform the booking data to match frontend expectations
    const transformedBooking = {
      _id: booking._id,
      startTime: booking.bookingDate ? new Date(booking.bookingDate).toISOString() : new Date().toISOString(),
      endTime: booking.bookingDate ? new Date(new Date(booking.bookingDate).getTime() + 30 * 60000).toISOString() : new Date(Date.now() + 30 * 60000).toISOString(),
      type: booking.type || 'online',
      status: booking.status || 'pending',
      pet: {
        _id: booking.pet._id,
        name: booking.pet.name,
        breed: booking.pet.breed,
        species: booking.pet.species,
        age: booking.pet.age,
        gender: booking.pet.gender
      },
      user: {
        _id: booking.petOwner._id,
        name: booking.petOwner.fullName || booking.petOwner.name,
        email: booking.petOwner.email
      },
      doctor: {
        name: 'Dr. Williams' // Default or fetch from clinic data
      },
      clinic: booking.clinic ? {
        _id: booking.clinic._id,
        clinicName: booking.clinic.clinicName,
        email: booking.clinic.email
      } : null,
      notes: booking.reason,
      googleMeetLink: booking.googleMeetLink,
      bookingDate: booking.bookingDate,
      appointmentTime: booking.appointmentTime
    };
    
    res.json({
      success: true,
      data: transformedBooking
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
};

// Update Google Meet link for a booking
exports.updateGoogleMeetLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { googleMeetLink } = req.body;

    if (!googleMeetLink) {
      return res.status(400).json({
        success: false,
        message: 'Google Meet link is required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has permission (doctor, clinic, or booking owner)
    const userRole = req.user.role || req.user.userType;
    const isAuthorized = 
      userRole === 'doctor' || 
      userRole === 'clinic' || 
      booking.petOwner.toString() === req.user.id ||
      booking.clinic.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update the Google Meet link
    booking.googleMeetLink = googleMeetLink;
    await booking.save();

    // Emit socket event for real-time updates
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('bookings_updated');
    }

    res.json({
      success: true,
      message: 'Google Meet link updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating Google Meet link:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Google Meet link',
      error: error.message
    });
  }
}; 