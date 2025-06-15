const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
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
  transports: ['websocket', 'polling']
});

// Initialize Socket.IO
initializeSocket(io);

// Connect to MongoDB
const connectDB = require('./config/config');
connectDB();

// --- Real-time Change Streams ---
const Pet = require('./models/petModel');
const Appointment = require('./models/appointmentModel');
const Prescription = require('./models/prescriptionModel');
const User = require('./models/userModel');
const Inventory = require('./models/inventoryModel');
const EMR = require('./models/emrModel');

// PETS
app.use('/api/emr', require('./routes/emrRoutes'));

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
  const users = await User.find();
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

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');

app.use('/api/users', userRoutes);
app.use('/api/pets', require('./routes/petRoutes'));
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// Test endpoint
app.post('/api/status', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO server is ready for connections`);
});