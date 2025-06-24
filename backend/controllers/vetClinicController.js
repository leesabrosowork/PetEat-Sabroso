const Pet = require('../models/petModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const EMR = require('../models/emrModel');
const Booking = require('../models/bookingModel');
const VideoConsultation = require('../models/videoConsultationModel');
const Prescription = require('../models/prescriptionModel');
const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');
const { createZoomMeeting } = require('../utils/zoom');
const { createGoogleMeet } = require('../utils/googleMeet');

// Get dashboard overview data
exports.getDashboardData = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        // Get all pets (for now, get all pets since we don't have clinic-specific associations yet)
        const pets = await Pet.find().populate('owner', 'username fullName name email');
        
        // Count pets by health status
        const petsByStatus = {
            stable: pets.filter(pet => pet.healthStatus === 'stable').length,
            checkup: pets.filter(pet => pet.healthStatus === 'checkup').length,
            critical: pets.filter(pet => pet.healthStatus === 'critical').length
        };

        // Get medical records count
        const medicalRecords = await EMR.find();
        
        // Get appointments data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const upcomingAppointments = await Booking.countDocuments({
            clinic: clinicId,
            bookingDate: { $gte: today },
            status: { $in: ['pending', 'confirmed'] }
        });
        
        const completedAppointments = await Booking.countDocuments({
            clinic: clinicId,
            bookingDate: { $gte: today, $lt: tomorrow },
            status: 'completed'
        });

        // Get video consultations (assuming they're appointments with type 'consultation')
        const videoConsultations = await VideoConsultation.countDocuments({
            clinic: clinicId,
            scheduledTime: { $gte: today },
            status: { $in: ['scheduled', 'in-progress'] }
        });

        // Get prescriptions count
        const prescriptions = await Prescription.countDocuments();

        // Get inventory data
        const inventoryItems = await Inventory.countDocuments();
        const lowStockItems = await Inventory.countDocuments({ 
            $or: [
                { quantity: { $lte: 10 } },
                { status: 'low-stock' }
            ]
        });

        res.json({
            success: true,
            data: {
                totalPets: pets.length,
                petsByStatus,
                totalMedicalRecords: medicalRecords.length,
                upcomingAppointments,
                completedAppointments,
                videoConsultations,
                totalPrescriptions: prescriptions,
                inventoryItems,
                lowStockItems
            }
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all pets for the clinic
exports.getPets = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        // Get all pets (for now, get all pets since we don't have clinic-specific associations yet)
        const pets = await Pet.find().populate('owner', 'username fullName name email');

        // Add health status if not present (default to stable)
        const petsWithStatus = pets.map(pet => ({
            ...pet.toObject(),
            healthStatus: pet.healthStatus || 'stable'
        }));

        res.json({
            success: true,
            data: petsWithStatus
        });
    } catch (error) {
        console.error('Get pets error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get medical records for the clinic
exports.getMedicalRecords = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        // Get all EMRs and deeply populate the petId.owner fields
        const emrRecords = await EMR.find()
            .populate({
                path: 'petId',
                select: 'name type breed owner',
                populate: {
                    path: 'owner',
                    select: 'name fullName contactNumber phone email address'
                }
            })
            .sort('-createdAt');

        // Get all PetMedicalRecord records
        const petMedicalRecords = await PetMedicalRecord.find()
            .sort('-createdAt');

        // Transform EMR data to match the frontend interface
        const transformedEmrRecords = emrRecords.map(emr => {
            // Owner info: prefer name, fallback to fullName, fallback to 'Unknown'
            let ownerInfo = { name: 'N/A', phone: 'N/A', email: 'N/A', address: '' };
            if (emr.petId?.owner) {
                const owner = emr.petId.owner;
                ownerInfo = {
                    name: owner.name || owner.fullName || 'Unknown',
                    phone: owner.contactNumber || owner.phone || 'N/A',
                    email: owner.email || 'N/A',
                    address: owner.address || ''
                };
            }
            return {
                _id: emr._id,
                petId: emr.petId?._id || 'unknown',
                name: emr.name,
                species: emr.species,
                breed: emr.breed,
                age: emr.age,
                sex: emr.sex,
                owner: ownerInfo,
                vaccinations: emr.vaccinations || [],
                medicalHistory: emr.medicalHistory || [],
                visitHistory: emr.visitHistory || [],
                createdAt: emr.createdAt,
                updatedAt: emr.updatedAt
            };
        });

        // Transform PetMedicalRecord data to match the frontend interface
        const transformedPetRecords = petMedicalRecords.map(record => ({
            _id: record._id,
            petId: record.petId,
            name: record.name,
            species: record.species,
            breed: record.breed,
            age: record.age,
            sex: record.sex,
            owner: record.owner || {
                name: 'N/A',
                phone: 'N/A',
                email: 'N/A',
                address: ''
            },
            vaccinations: record.vaccinations || [],
            medicalHistory: record.medicalHistory || [],
            visitHistory: record.visitHistory || [],
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        }));

        // Combine both record types
        const combinedRecords = [...transformedEmrRecords, ...transformedPetRecords];

        // Sort by creation date (newest first)
        combinedRecords.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        res.json({
            success: true,
            data: combinedRecords
        });
    } catch (error) {
        console.error('Get medical records error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get appointments for the clinic
exports.getAppointments = async (req, res) => {
    try {
        const clinicId = req.user._id;
        const bookings = await Booking.find({ clinic: clinicId })
            .populate('pet', 'name type breed')
            .populate('petOwner', 'fullName email')
            .populate('clinic', 'clinicName email')
            .sort({ bookingDate: 1, appointmentTime: 1 });
        const transformed = bookings.map(b => {
            const startTime = getBookingStartTime(b);
            return {
                _id: b._id,
                pet: b.pet,
                user: b.petOwner,
                startTime,
                status: b.status || 'N/A',
                notes: b.reason || 'N/A',
            };
        });
        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get video consultations for the clinic
exports.getVideoConsultations = async (req, res) => {
    try {
        const clinicId = req.user._id;
        const videoConsultations = await VideoConsultation.find({ clinic: clinicId })
            .populate('pet')
            .populate('petOwner', 'username fullName name email')
            .sort({ scheduledTime: 1 });
        res.json({
            success: true,
            data: videoConsultations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get prescriptions for the clinic
exports.getPrescriptions = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        const prescriptions = await Prescription.find()
            .populate('pet')
            .populate('user', 'username fullName name email')
            .populate('medicine', 'item')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create a new prescription
exports.createPrescription = async (req, res) => {
    try {
        const { pet, user, medicine, description } = req.body;
        
        // Validate required fields
        if (!pet || !user || !medicine || !description) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: pet, user, medicine, description'
            });
        }

        // Create new prescription
        const newPrescription = new Prescription({
            pet,
            user,
            doctor: req.user._id, // Set the current vet clinic as the doctor
            medicine,
            description
        });

        await newPrescription.save();

        // Populate the prescription for response
        await newPrescription.populate([
            { path: 'pet', select: 'name' },
            { path: 'user', select: 'name email' },
            { path: 'medicine', select: 'item' }
        ]);

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('prescriptions_updated');
        }

        res.status(201).json({
            success: true,
            data: newPrescription
        });
    } catch (error) {
        console.error('Error in createPrescription:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get inventory for the clinic
exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        // Return all inventory items sorted by name
        const inventory = await Inventory.find().sort({ item: 1 });

        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update pet health status
exports.updatePetHealthStatus = async (req, res) => {
    try {
        const { petId } = req.params;
        const { healthStatus } = req.body;

        if (!['stable', 'checkup', 'critical'].includes(healthStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid health status. Must be stable, checkup, or critical.'
            });
        }

        const pet = await Pet.findByIdAndUpdate(
            petId,
            { healthStatus },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('pets_updated');
        }

        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        console.error('Update pet health status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create medical record
exports.createMedicalRecord = async (req, res) => {
    try {
        console.log('Creating medical record with data:', req.body);
        const medicalRecord = new PetMedicalRecord(req.body);
        await medicalRecord.save();
        console.log('Successfully created medical record:', medicalRecord._id);

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('emrs_updated');
        }

        res.status(201).json({
            success: true,
            data: medicalRecord
        });
    } catch (error) {
        console.error('Error in createMedicalRecord:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update medical record
exports.updateMedicalRecord = async (req, res) => {
    try {
        const { petId } = req.params;
        
        const medicalRecord = await PetMedicalRecord.findOneAndUpdate(
            { petId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('emrs_updated');
        }

        res.json({
            success: true,
            data: medicalRecord
        });
    } catch (error) {
        console.error('Update medical record error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item, stock, minStock, category, status } = req.body;

        const inventoryItem = await Inventory.findById(id);
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Update fields
        if (item) inventoryItem.item = item;
        if (stock !== undefined) inventoryItem.stock = stock;
        if (minStock !== undefined) inventoryItem.minStock = minStock;
        if (category) inventoryItem.category = category;
        // Don't override status - let middleware handle it based on stock levels
        // if (status) inventoryItem.status = status;

        await inventoryItem.save(); // This will trigger the middleware

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
        console.error('Update inventory item error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Add inventory item
exports.addInventoryItem = async (req, res) => {
    try {
        const inventoryItem = new Inventory(req.body);
        await inventoryItem.save();
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }
        res.status(201).json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
        console.error('Add inventory item error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await Inventory.findByIdAndDelete(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add a new pet
exports.addPet = async (req, res) => {
    try {
        const petData = req.body;
        // Optionally associate with clinic: petData.clinic = req.user._id;
        const newPet = await Pet.create(petData);
        // Populate owner for response
        await newPet.populate('owner', 'username fullName name email');
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('pets_updated');
        }
        res.status(201).json({ success: true, data: newPet });
    } catch (error) {
        console.error('Add pet error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete prescription
exports.deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Prescription.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        // Optionally emit socket event here
        if (req.app.get('io')) {
            req.app.get('io').emit('prescriptions_updated');
        }
        res.json({ success: true, message: 'Prescription deleted' });
    } catch (error) {
        console.error('Delete prescription error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Increment or decrement inventory stock
exports.updateInventoryStock = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { amount } = req.body;
        if (typeof amount !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a number'
            });
        }
        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        item.stock += amount;
        if (item.stock < 0) item.stock = 0;
        await item.save();
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Update inventory stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUBLIC: Get all approved clinics
exports.getAllApprovedClinics = async (req, res) => {
    try {
        const clinics = await User.find({ role: 'clinic', status: 'approved' }).select('-password -otp -otpExpires');
        res.json({
            success: true,
            data: clinics
        });
    } catch (error) {
        console.error('Get all approved clinics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Approve an appointment
exports.approveAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Booking.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'confirmed';
        await appointment.save();

        // If appointment type is 'consultation', create Google Meet link and update videoConsultation
        if (appointment.type === 'consultation') {
            // Find the corresponding video consultation
            const videoConsultation = await VideoConsultation.findOne({
                petOwner: appointment.petOwner,
                clinic: appointment.clinic,
                pet: appointment.pet,
                scheduledTime: appointment.bookingDate
            });
            if (videoConsultation) {
                // --- Google Meet Integration ---
                try {
                    // Fetch tokens for clinic from DB
                    const clinicUser = await User.findById(appointment.clinic);
                    const googleTokens = clinicUser && clinicUser.googleTokens;
                    if (googleTokens) {
                        const startTime = appointment.bookingDate.toISOString();
                        const endTime = new Date(new Date(appointment.bookingDate).getTime() + (videoConsultation.duration || 30) * 60000).toISOString();
                        const meetResult = await createGoogleMeet({
                            summary: `Consultation for ${videoConsultation.pet}`,
                            description: `Consultation with pet owner`,
                            startTime,
                            endTime,
                            tokens: googleTokens
                        });
                        videoConsultation.googleMeetLink = meetResult.meetLink;
                        await videoConsultation.save();
                        appointment.googleMeetLink = meetResult.meetLink;
                        await appointment.save();
                    } else {
                        console.warn('No Google tokens found for clinic, skipping Meet creation.');
                    }
                } catch (meetErr) {
                    console.error('Failed to create Google Meet:', meetErr);
                }
            }
        }

        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('appointments_updated');
        }
        res.json({ success: true, message: 'Appointment approved', data: appointment });
    } catch (error) {
        console.error('Approve appointment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject an appointment
exports.rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Booking.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'cancelled';
        await appointment.save();
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('appointments_updated');
        }
        res.json({ success: true, message: 'Appointment rejected', data: appointment });
    } catch (error) {
        console.error('Reject appointment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a medical record
exports.deleteMedicalRecord = async (req, res) => {
    try {
        const recordId = req.params.id;
        console.log(`Attempting to delete medical record with ID: ${recordId}`);
        
        // Explicitly import both models to avoid any confusion
        const EMR = require('../models/emrModel');
        const PetMedicalRecord = require('../models/petMedicalRecord');
        
        // Try to find and delete from EMR collection first
        console.log('Checking EMR collection...');
        let deletedRecord = await EMR.findByIdAndDelete(recordId);
        console.log('EMR deletion result:', deletedRecord ? 'Found and deleted' : 'Not found');
        
        // If not found in EMR, try PetMedicalRecord collection
        if (!deletedRecord) {
            console.log('Checking PetMedicalRecord collection...');
            deletedRecord = await PetMedicalRecord.findByIdAndDelete(recordId);
            console.log('PetMedicalRecord deletion result:', deletedRecord ? 'Found and deleted' : 'Not found');
        }
        
        if (!deletedRecord) {
            console.log('Medical record not found in either collection');
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }
        
        console.log('Medical record deleted successfully');
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('emrs_updated');
        }
        res.json({
            success: true,
            message: 'Medical record deleted successfully'
        });
    } catch (error) {
        console.error('Delete medical record error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Activity Feed for the clinic
exports.getActivityFeed = async (req, res) => {
    try {
        // If you have an Activity model, fetch recent activities for this clinic
        // const activities = await Activity.find({ clinic: req.user._id }).sort({ createdAt: -1 }).limit(50);
        // For now, return a static array as a placeholder
        const activities = [
            { _id: '1', type: 'appointment', description: 'New appointment booked', createdAt: new Date() },
            { _id: '2', type: 'pet', description: 'New pet admitted', createdAt: new Date() },
        ];
        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Get activity feed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

function getBookingStartTime(booking) {
    // If both are present and valid
    if (
        booking.bookingDate &&
        typeof booking.appointmentTime === 'string' &&
        booking.appointmentTime.includes(':')
    ) {
        const [hours, minutes] = booking.appointmentTime.split(':');
        if (!isNaN(Number(hours)) && !isNaN(Number(minutes))) {
            const date = new Date(booking.bookingDate);
            date.setHours(Number(hours), Number(minutes), 0, 0);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
    }
    // If only bookingDate is present
    if (booking.bookingDate && !booking.appointmentTime) {
        const date = new Date(booking.bookingDate);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    // If only appointmentTime is present
    if (!booking.bookingDate && typeof booking.appointmentTime === 'string' && booking.appointmentTime.includes(':')) {
        const [hours, minutes] = booking.appointmentTime.split(':');
        if (!isNaN(Number(hours)) && !isNaN(Number(minutes))) {
            const date = new Date();
            date.setHours(Number(hours), Number(minutes), 0, 0);
            return date.toISOString();
        }
    }
    // If neither is present
    return null;
}

// PUBLIC: Get all clinics (regardless of status)
exports.getAllClinics = async (req, res) => {
    try {
        // Fetch all users with role or userType 'clinic'
        const clinics = await User.find({
            $or: [
                { role: 'clinic' },
                { userType: 'clinic' }
            ]
        }).select('-password -otp -otpExpires');
        res.json({
            success: true,
            data: clinics
        });
    } catch (error) {
        console.error('Get all clinics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 