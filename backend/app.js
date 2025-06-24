const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const emrRoutes = require('./routes/emrRoutes');
const staffRoutes = require('./routes/staffRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const vetClinicApiRouter = require('./routes/vetClinicApiRouter');
const petsUnderTreatmentRoutes = require('./routes/petsUnderTreatmentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const videoConsultationRoutes = require('./routes/videoConsultationRoutes');
const clinicalNoteRoutes = require('./routes/clinicalNoteRoutes');
const googleMeetRoutes = require('./routes/googleMeetRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/emr', emrRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/vet-clinic', vetClinicApiRouter);
app.use('/api/pets-under-treatment', petsUnderTreatmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/video-consultations', videoConsultationRoutes);
app.use('/api/clinical-notes', clinicalNoteRoutes);
app.use('/api/google-meet', googleMeetRoutes);

// Status endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/status', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

module.exports = app;