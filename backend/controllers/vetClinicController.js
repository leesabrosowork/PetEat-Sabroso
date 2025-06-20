const VetClinic = require('../models/vetClinicModel');
const Pet = require('../models/petModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const EMR = require('../models/emrModel');
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');
const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');

// Get dashboard overview data
exports.getDashboardData = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        // Get all pets (for now, get all pets since we don't have clinic-specific associations yet)
        const pets = await Pet.find().populate('owner');
        
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
        
        const upcomingAppointments = await Appointment.countDocuments({
            startTime: { $gte: today },
            status: 'scheduled'
        });
        
        const completedAppointments = await Appointment.countDocuments({
            startTime: { $gte: today, $lt: tomorrow },
            status: 'completed'
        });

        // Get video consultations (assuming they're appointments with type 'consultation')
        const videoConsultations = await Appointment.countDocuments({
            type: 'consultation',
            startTime: { $gte: today },
            status: 'scheduled'
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
        const pets = await Pet.find().populate('owner', 'name email');

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
        
        // Get all EMRs and populate the petId field with owner information
        const medicalRecords = await EMR.find()
            .populate('petId', 'name type breed owner')
            .sort('-createdAt');

        // Transform the data to match the frontend interface
        const transformedRecords = medicalRecords.map(emr => ({
            _id: emr._id,
            petId: emr.petId._id,
            name: emr.name,
            species: emr.species,
            breed: emr.breed,
            age: emr.age,
            sex: emr.sex,
            owner: emr.petId.owner ? {
                name: emr.petId.owner.name,
                phone: emr.petId.owner.contactNumber || emr.petId.owner.phone,
                email: emr.petId.owner.email
            } : {
                name: 'N/A',
                phone: 'N/A',
                email: 'N/A'
            },
            vaccinations: emr.vaccinations || [],
            medicalHistory: emr.medicalHistory || [],
            visitHistory: emr.visitHistory || []
        }));

        res.json({
            success: true,
            data: transformedRecords
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
        const appointments = await Appointment.find({ type: { $ne: 'consultation' } })
            .populate('pet')
            .populate('user', 'name email')
            .populate('doctor', 'name')
            .select('+notes')
            .sort({ startTime: 1 });
        res.json({
            success: true,
            data: appointments
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
        const videoConsultations = await Appointment.find({ type: 'consultation' })
            .populate('pet')
            .populate('user', 'name email')
            .populate('doctor', 'name')
            .sort({ startTime: 1 });
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
            .populate('user', 'name email')
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

        res.status(201).json({
            success: true,
            data: newPrescription
        });
    } catch (error) {
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
        
        const inventory = await Inventory.find().sort({ item: 1 });

        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
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

        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create medical record
exports.createMedicalRecord = async (req, res) => {
    try {
        const medicalRecord = new PetMedicalRecord(req.body);
        await medicalRecord.save();

        res.status(201).json({
            success: true,
            data: medicalRecord
        });
    } catch (error) {
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

        res.json({
            success: true,
            data: medicalRecord
        });
    } catch (error) {
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

        res.json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
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
            req.app.get('io').emit('inventory:added', inventoryItem);
        }
        res.status(201).json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
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

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
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
        await newPet.populate('owner', 'name email');
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('pet:added', newPet);
        }
        res.status(201).json({ success: true, data: newPet });
    } catch (error) {
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
        res.json({ success: true, message: 'Prescription deleted' });
    } catch (error) {
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
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUBLIC: Get all approved clinics
exports.getAllApprovedClinics = async (req, res) => {
    try {
        const clinics = await VetClinic.find({ status: 'approved' }).select('-password -otp -otpExpires');
        res.json({
            success: true,
            data: clinics
        });
    } catch (error) {
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
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'scheduled';
        await appointment.save();
        res.json({ success: true, message: 'Appointment approved', data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject an appointment
exports.rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        appointment.status = 'rejected';
        await appointment.save();
        res.json({ success: true, message: 'Appointment rejected', data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 