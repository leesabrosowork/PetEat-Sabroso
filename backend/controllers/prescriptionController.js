const Prescription = require('../models/prescriptionModel');
const Pet = require('../models/petModel');

// Get all prescriptions for the authenticated doctor
exports.getDoctorPrescriptions = async (req, res) => {
    try {
        const doctorId = req.user.id;
        // Find all prescriptions for this doctor
        const prescriptions = await Prescription.find({ doctor: doctorId })
            .populate([
                { path: 'pet', select: 'name' },
                { path: 'user', select: 'name email' },
                { path: 'medicine', select: 'item' }
            ]);
        res.json({ success: true, data: prescriptions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching prescriptions', error: err.message });
    }
};
// Create a new prescription
exports.createPrescription = async (req, res) => {
    try {
        const { petId, medicineId, description } = req.body;
        const doctorId = req.user.id;

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const newPrescription = new Prescription({
            pet: petId,
            doctor: doctorId,
            user: pet.owner,
            medicine: medicineId,
            description
        });

        await newPrescription.save();
        res.status(201).json({ success: true, data: newPrescription });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Error creating prescription', error: err.message });
    }
};

// Get all prescriptions for a user
exports.getUserPrescriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const prescriptions = await Prescription.find({ user: userId })
            .populate('pet', 'name')
            .populate('doctor', 'name')
            .populate('medicine', 'item');
        res.json({ success: true, data: prescriptions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching prescriptions', error: err.message });
    }
};

// Delete a prescription by ID (doctor only)
exports.deletePrescription = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const prescription = await Prescription.findOneAndDelete({ _id: req.params.id, doctor: doctorId });
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found or not authorized' });
        }
        res.json({ success: true, message: 'Prescription deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting prescription', error: err.message });
    }
};

// Get a single prescription by ID
exports.getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('pet', 'name')
            .populate('doctor', 'name')
            .populate('medicine', 'item');
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        res.json({ success: true, data: prescription });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching prescription', error: err.message });
    }
};
