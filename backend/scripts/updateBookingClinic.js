const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');

async function updateBookingClinic() {
  try {
    await mongoose.connect('mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d');
    console.log('Connected to MongoDB');
    
    // Find the booking with the old clinic ID
    const oldClinicId = '6859702353e77380d880df69';
    const newClinicId = '685b7a8716040422e5a246d2';
    
    const booking = await Booking.findOne({ clinic: oldClinicId });
    if (booking) {
      console.log('Found booking:', booking._id);
      console.log('Old clinic ID:', booking.clinic);
      
      // Update the booking to use the new clinic ID
      booking.clinic = newClinicId;
      await booking.save();
      
      console.log('Updated booking clinic ID to:', booking.clinic);
      console.log('Booking updated successfully!');
    } else {
      console.log('No booking found with the old clinic ID');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateBookingClinic(); 