const Doctor = require('../models/doctorModel');

const Appointment = require('../models/appointmentModel');
const Pet = require('../models/petModel');

// Update a doctor's availability
exports.updateAvailability = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { availability } = req.body;
        if (!['available', 'not available'].includes(availability)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid availability value.'
            });
        }
        const doctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { availability },
            { new: true }
        ).select('-password');
        if (!doctor) {
            return res.status(404).json({
                status: 'fail',
                message: 'Doctor not found.'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { doctor }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create a new doctor
exports.createDoctor = async (req, res) => {
    try {
        const { name, email, password, contact, address, specialty, availability } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({
            $or: [
                { email },
                { contact }
            ]
        });
        if (existingDoctor) {
            return res.status(400).json({
                status: 'fail',
                message: existingDoctor.email === email ?
                    'Email already in use' :
                    'Contact number already in use'
            });
        }

        // Create new doctor
        const newDoctor = await Doctor.create({
            name,
            email,
            password, // will be hashed by pre-save middleware
            contact,
            address,
            specialty,
            availability
        });

        // Remove password from response
        newDoctor.password = undefined;

        res.status(201).json({
            status: 'success',
            data: {
                doctor: newDoctor
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
// Get doctor dashboard data
exports.getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const upcomingAppointments = await Appointment.find({
            doctor: doctorId,
            status: 'scheduled',
            startTime: { $gte: new Date() }
        })
        .populate('user', 'name email')
        .populate('pet', 'name')
        .sort({ startTime: 'asc' });

        const pastAppointments = await Appointment.find({
            doctor: doctorId,
            status: { $in: ['completed', 'cancelled'] },
            startTime: { $lt: new Date() }
        })
        .populate('user', 'name email')
        .populate('pet', 'name')
        .sort({ startTime: 'desc' });

        res.json({
            success: true,
            data: {
                upcomingAppointments,
                pastAppointments
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor dashboard data',
            error: error.message
        });
    }
};

// Get all patients for a doctor
exports.getDoctorPatients = async (req, res) => {
    try {
        console.log('Fetching doctor patients...');
        // Find all pets and populate their owner information
        const pets = await Pet.find().populate('owner', 'username email');
        console.log('Pets found:', pets.length);
        console.log('Sample pet data:', pets[0]);

        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        console.error('Error in getDoctorPatients:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor patients',
            error: error.message
        });
    }
};
