const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const emrRoutes = require('./routes/emrRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/emr', emrRoutes);


module.exports = app;