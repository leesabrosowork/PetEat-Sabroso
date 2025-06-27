const Pet = require('../models/petModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const EMR = require('../models/emrModel');
const Booking = require('../models/bookingModel');
const VideoConsultation = require('../models/videoConsultationModel');
const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');
const { createZoomMeeting } = require('../utils/zoom');
const { createGoogleMeet } = require('../utils/googleMeet');
const { sendBookingApprovalEmails } = require('../utils/emailService');

// Get dashboard overview data
exports.getDashboardData = async (req, res) => {
    try {
        const clinicId = req.user.id;
        console.log('📊 Dashboard data for clinic ID:', clinicId);
        
        // Use Promise.all for parallel execution of all queries
        const [
            pets,
            medicalRecords,
            upcomingAppointments,
            completedAppointments,
            videoConsultations,
            inventoryItems,
            lowStockItems
        ] = await Promise.all([
            // Get all pets
            Pet.find().populate('owner', 'username fullName name email'),
            // Get medical records count
            EMR.countDocuments(),
            // Get upcoming appointments
            Booking.countDocuments({
                clinic: clinicId,
                bookingDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                status: { $in: ['pending', 'confirmed'] }
            }),
            // Get completed appointments for today
            Booking.countDocuments({
                clinic: clinicId,
                bookingDate: { 
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setDate(new Date().getDate() + 1))
                },
                status: 'completed'
            }),
            // Get video consultations
            Booking.countDocuments({
                clinic: clinicId,
                bookingDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                type: 'online',
                status: { $in: ['pending', 'confirmed'] }
            }),
            // Get inventory count
            Inventory.countDocuments(),
            // Get low stock items
            Inventory.countDocuments({ 
                $or: [
                    { quantity: { $lte: 10 } },
                    { status: 'low-stock' }
                ]
            })
        ]);
        
        console.log('📊 Dashboard counts:', {
            upcomingAppointments,
            completedAppointments,
            videoConsultations
        });
        
        // Count pets by health status
        const petsByStatus = {
            stable: pets.filter(pet => pet.healthStatus === 'stable').length,
            checkup: pets.filter(pet => pet.healthStatus === 'checkup').length,
            critical: pets.filter(pet => pet.healthStatus === 'critical').length
        };

        res.json({
            success: true,
            data: {
                totalPets: pets.length,
                petsByStatus,
                totalMedicalRecords: medicalRecords,
                upcomingAppointments,
                completedAppointments,
                videoConsultations,
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
        const clinicId = req.user.id;
        
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
        const clinicId = req.user.id;
        
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
        const clinicId = req.user.id;
        console.log('🔍 Looking for appointments for clinic ID:', clinicId);
        console.log('🔍 Clinic ID type:', typeof clinicId);
        
        // First, let's see all bookings in the database
        const allBookings = await Booking.find({});
        console.log('📋 Total bookings in database:', allBookings.length);
        allBookings.forEach(booking => {
            console.log(`📋 Booking ID: ${booking._id}, Clinic: ${booking.clinic}, Status: ${booking.status}, Type: ${booking.type}`);
        });
        
        const bookings = await Booking.find({ clinic: clinicId })
            .populate('pet', 'name type breed')
            .populate('petOwner', 'fullName email')
            .populate('clinic', 'clinicName email')
            .sort({ bookingDate: 1, appointmentTime: 1 });
            
        console.log('✅ Found bookings for this clinic:', bookings.length);
        
        const transformed = bookings.map(b => {
            const startTime = getBookingStartTime(b);
            return {
                _id: b._id,
                pet: b.pet,
                user: b.petOwner,
                startTime,
                status: b.status || 'N/A',
                notes: b.reason || 'N/A',
                type: b.type || 'in person',
                googleMeetLink: b.googleMeetLink
            };
        });
        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        console.error('❌ Error in getAppointments:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get video consultations for the clinic
exports.getVideoConsultations = async (req, res) => {
    try {
        const clinicId = req.user.id;
        console.log('🎥 Fetching video consultations for clinic ID:', clinicId);
        
        // Only get CONFIRMED online appointments for video consultations
        const videoConsultations = await Booking.find({
            clinic: clinicId,
            type: 'online',
            status: 'confirmed' // Only confirmed appointments show up in video consultations
        })
        .populate('pet', 'name type breed')
        .populate('petOwner', 'fullName name email')
        .sort({ bookingDate: 1, appointmentTime: 1 });
        
        console.log(`📹 Found ${videoConsultations.length} confirmed video consultations`);

        // Transform to match frontend expectations
        const transformed = videoConsultations.map(b => {
            let startTime = 'N/A';
            let endTime = 'N/A';
            
            if (b.bookingDate && b.appointmentTime) {
                const startDate = new Date(b.bookingDate);
                const [hours, minutes] = b.appointmentTime.split(':');
                startDate.setHours(Number(hours), Number(minutes), 0, 0);
                startTime = startDate.toISOString();
                
                // Calculate end time (30 minutes after start time)
                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + 30);
                endTime = endDate.toISOString();
                
                console.log(`📅 Appointment times: Start=${startTime}, End=${endTime}`);
            }
            
            return {
                _id: b._id,
                startTime,
                endTime, // Add the missing endTime
                status: b.status,
                pet: b.pet,
                user: b.petOwner,
                googleMeetLink: b.googleMeetLink,
                type: b.type,
                doctor: { name: 'Dr. Williams' } // Add doctor info for consistency
            };
        });

        console.log('📤 Sending video consultations response:', { 
            success: true, 
            count: transformed.length,
            sampleData: transformed[0] || 'No data'
        });

        res.json({
            success: true,
            data: transformed
        });
    } catch (error) {
        console.error('❌ Get video consultations error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get inventory for the clinic
exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user.id;
        
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
        console.log(`📅 Approving appointment with ID: ${id}`);
        
        // Populate petOwner and clinic
        const appointment = await Booking.findById(id)
            .populate('petOwner', 'email fullName')
            .populate('clinic', 'email googleTokens clinicName address')
            .populate('pet', 'name');
            
        if (!appointment) {
            console.log(`❌ Appointment not found: ${id}`);
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        console.log(`📋 Appointment details:`, {
            type: appointment.type,
            status: appointment.status,
            petName: appointment.pet?.name,
            petOwnerEmail: appointment.petOwner?.email
        });
        
        appointment.status = 'confirmed';
        
        // Only create Google Meet link for online appointments, and only if we have Google tokens
        if (appointment.type === 'online') {
            console.log(`🎥 Online appointment - attempting to create Google Meet link`);
            try {
                const petOwnerEmail = appointment.petOwner?.email;
                const clinicEmail = appointment.clinic?.email;
                const googleTokens = appointment.clinic?.googleTokens;
                
                console.log(`🔍 Google Meet prerequisites:`, {
                    hasTokens: !!googleTokens,
                    petOwnerEmail: !!petOwnerEmail,
                    clinicEmail: !!clinicEmail
                });
                
                if (googleTokens && petOwnerEmail && clinicEmail) {
                    const startDate = new Date(appointment.bookingDate);
                    if (appointment.appointmentTime) {
                        const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
                        startDate.setHours(hours, minutes, 0, 0);
                    }
                    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min duration
                    
                    const meetResult = await createGoogleMeet({
                        summary: `Online Consultation for ${appointment.pet?.name || 'Pet'}`,
                        description: `Online consultation for ${appointment.pet?.name || 'Pet'}`,
                        startTime: startDate.toISOString(),
                        endTime: endDate.toISOString(),
                        tokens: googleTokens
                    });
                    
                    if (meetResult && meetResult.meetLink) {
                        appointment.googleMeetLink = meetResult.meetLink;
                        console.log(`✅ Google Meet link created: ${meetResult.meetLink}`);
                    } else {
                        console.warn('❌ Google Meet creation returned no link');
                    }
                } else {
                    console.warn('⚠️ Missing Google tokens or attendee emails, skipping Meet creation.');
                    console.warn(`Details: tokens=${!!googleTokens}, petOwner=${!!petOwnerEmail}, clinic=${!!clinicEmail}`);
                }
            } catch (meetErr) {
                console.error('❌ Failed to create Google Meet:', meetErr);
                // Don't fail the approval just because Google Meet creation failed
            }
        } else {
            console.log(`📍 In-person appointment - no Google Meet link needed`);
        }
        
        await appointment.save();
        console.log(`✅ Appointment ${id} approved successfully`);
        
        // Send email notifications to both user and clinic
        try {
            console.log(`📧 Sending approval emails...`);
            const emailData = {
                petOwnerEmail: appointment.petOwner?.email,
                petOwnerName: appointment.petOwner?.fullName || appointment.petOwner?.name,
                clinicEmail: appointment.clinic?.email,
                clinicName: appointment.clinic?.clinicName || appointment.clinic?.name,
                petName: appointment.pet?.name,
                bookingDate: new Date(appointment.bookingDate).toLocaleDateString(),
                appointmentTime: appointment.appointmentTime,
                type: appointment.type,
                reason: appointment.reason,
                googleMeetLink: appointment.googleMeetLink,
                clinicAddress: appointment.clinic?.address
            };
            
            const emailResults = await sendBookingApprovalEmails(emailData);
            console.log(`📧 Email results:`, emailResults);
        } catch (emailErr) {
            console.error('❌ Failed to send approval emails:', emailErr);
            // Don't fail the approval just because email sending failed
        }
        
        // Emit socket event for real-time update
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('appointments_updated');
        }
        
        res.json({ success: true, message: 'Appointment approved', data: appointment });
    } catch (error) {
        console.error('❌ Approve appointment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject an appointment
exports.rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`❌ Rejecting appointment with ID: ${id}`);
        
        const appointment = await Booking.findById(id);
        if (!appointment) {
            console.log(`❌ Appointment not found: ${id}`);
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        console.log(`📋 Rejecting appointment for pet: ${appointment.pet}`);
        appointment.status = 'cancelled';
        await appointment.save();
        
        console.log(`✅ Appointment ${id} rejected successfully`);
        
        // Emit socket event for real-time update
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('appointments_updated');
        }
        
        res.json({ success: true, message: 'Appointment rejected', data: appointment });
    } catch (error) {
        console.error('❌ Reject appointment error:', error);
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