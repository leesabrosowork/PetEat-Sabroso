const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Admin = require('./models/adminModel');
const Doctor = require('./models/doctorModel');
const Staff = require('./models/staffModel');
const User = require('./models/userModel');
const Pet = require('./models/petModel');
const Appointment = require('./models/appointmentModel');
const Prescription = require('./models/prescriptionModel');
const Inventory = require('./models/inventoryModel');
const EMR = require('./models/petMedicalRecord');
const VetClinic = require('./models/vetClinicModel');
require('dotenv').config();

const { initializeSocket } = require('./src/socket/socketHandler');
const app = require('./app');
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  // Add timeout configurations to prevent disconnections
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 10000, // 10 seconds
  allowUpgrades: true,
  maxHttpBufferSize: 1e6, // 1MB
});

// Initialize Socket.IO
initializeSocket(io);

// Export io for use in other files
module.exports.io = io;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Set up change streams after successful connection
    setupChangeStreams();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Set up change streams for real-time updates
const setupChangeStreams = () => {
  // ADMINS
  Admin.watch().on('change', async (change) => {
    const admins = await Admin.find().select('-password');
    io.emit('admins_updated', admins);
  });

  // DOCTORS
  Doctor.watch().on('change', async (change) => {
    const doctors = await Doctor.find().select('-password');
    io.emit('doctors_updated', doctors);
  });

  // STAFF
  Staff.watch().on('change', async (change) => {
    const staff = await Staff.find().select('-password');
    io.emit('staff_updated', staff);
  });

  // PETS
  Pet.watch().on('change', async (change) => {
    const pets = await Pet.find();
    io.emit('pets_updated', pets);
  });

  // APPOINTMENTS
  Appointment.watch().on('change', async (change) => {
    const appointments = await Appointment.find();
    io.emit('appointments_updated', appointments);
  });

  // PRESCRIPTIONS
  Prescription.watch().on('change', async (change) => {
    const prescriptions = await Prescription.find();
    io.emit('prescriptions_updated', prescriptions);
  });

  // USERS
  User.watch().on('change', async (change) => {
    const users = await User.find().select('-password');
    io.emit('users_updated', users);
  });

  // INVENTORY
  Inventory.watch().on('change', async (change) => {
    const inventory = await Inventory.find();
    io.emit('inventory_updated', inventory);
  });

  // EMRs
  EMR.watch().on('change', async (change) => {
    const emrs = await EMR.find();
    io.emit('emrs_updated', emrs);
  });

  // VET CLINICS
  VetClinic.watch().on('change', async (change) => {
    const vetClinics = await VetClinic.find().select('-password');
    io.emit('vet_clinics_updated', vetClinics);
  });
};

// Start server only after MongoDB connection is established
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 8080;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO server is ready for connections`);
  });
};

startServer();