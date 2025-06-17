const VetClinic = require('../models/vetClinicModel');
const Pet = require('../models/petModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
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
        const medicalRecords = await PetMedicalRecord.find();
        
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
        
        // Get all medical records (for now, get all records since we don't have clinic-specific associations yet)
        const medicalRecords = await PetMedicalRecord.find();

        res.json({
            success: true,
            data: medicalRecords
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
        
        const appointments = await Appointment.find()
            .populate('pet')
            .populate('user', 'name email')
            .populate('doctor', 'name')
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
            .populate('medicine', 'name')
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

// Get inventory for the clinic
exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        const inventory = await Inventory.find().sort({ name: 1 });

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
        const { name, quantity, category, status, price } = req.body;

        const item = await Inventory.findByIdAndUpdate(
            id,
            { name, quantity, category, status, price },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.json({
            success: true,
            data: item
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