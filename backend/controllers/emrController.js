const EMR = require('../models/emrModel');
const Pet = require('../models/petModel');

// @desc    Create new EMR
// @route   POST /api/emr
// @access  Private/Doctor
exports.createEMR = async (req, res) => {
    try {
        const {
            petId,
            diagnosis,
            treatment,
            medications,
            notes,
            followUpDate,
            attachments
        } = req.body;

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        const emr = await EMR.create({
            pet: petId,
            owner: pet.owner,
            doctor: req.user._id,
            diagnosis,
            treatment,
            medications,
            notes,
            followUpDate,
            attachments
        });

        res.status(201).json({
            success: true,
            data: emr
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating EMR',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for a pet
// @route   GET /api/emr/pet/:petId
// @access  Private
exports.getPetEMRs = async (req, res) => {
    try {
        const emrs = await EMR.find({ pet: req.params.petId })
            .populate('doctor', 'name')
            .populate('pet', 'name')
            .sort('-visitDate');

        res.json({
            success: true,
            data: emrs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching EMRs',
            error: error.message
        });
    }
};

// @desc    Get single EMR
// @route   GET /api/emr/:id
// @access  Private
exports.getEMR = async (req, res) => {
    try {
        const emr = await EMR.findById(req.params.id)
            .populate('doctor', 'name')
            .populate('pet', 'name')
            .populate('owner', 'name email');

        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Defensive patch: if any populated field is missing, set to { name: 'Unknown' }
        if (emr) {
            if (!emr.pet) emr.pet = { name: "Unknown" };
            if (!emr.owner) emr.owner = { name: "Unknown" };
            if (!emr.doctor) emr.doctor = { name: "Unknown" };
        }
        res.json({
            success: true,
            data: emr
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching EMR',
            error: error.message
        });
    }
};

// @desc    Update EMR
// @route   PUT /api/emr/:id
// @access  Private/Doctor
exports.updateEMR = async (req, res) => {
    try {
        const {
            diagnosis,
            treatment,
            medications,
            notes,
            followUpDate,
            attachments,
            status
        } = req.body;

        const emr = await EMR.findById(req.params.id);
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Check if the doctor is the one who created the EMR
        if (emr.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this EMR'
            });
        }

        const updatedEMR = await EMR.findByIdAndUpdate(
            req.params.id,
            {
                diagnosis,
                treatment,
                medications,
                notes,
                followUpDate,
                attachments,
                status
            },
            { new: true }
        ).populate('doctor', 'name')
         .populate('pet', 'name')
         .populate('owner', 'name email');

        res.json({
            success: true,
            data: updatedEMR
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating EMR',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for a doctor
// @route   GET /api/emr/doctor
// @access  Private/Doctor
exports.getDoctorEMRs = async (req, res) => {
    try {
        const emrs = await EMR.find({ doctor: req.user._id })
            .populate('pet', 'name')
            .populate('owner', 'name')
            .sort('-visitDate');

        res.json({
            success: true,
            data: emrs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching EMRs',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for a user's pets
// @route   GET /api/emr/user
// @access  Private/User
exports.getUserEMRs = async (req, res) => {
    try {
        const emrs = await EMR.find({ owner: req.user._id })
            .populate('pet', 'name')
            .populate('doctor', 'name')
            .sort('-visitDate');

        res.json({
            success: true,
            data: emrs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching EMRs',
            error: error.message
        });
    }
}; 

// @desc    Delete EMR
// @route   DELETE /api/emr/:id
// @access  Private/Doctor
exports.deleteEMR = async (req, res) => {
    try {
        const emr = await EMR.findByIdAndDelete(req.params.id);
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }
        res.json({
            success: true,
            message: 'EMR deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting EMR',
            error: error.message
        });
    }
};

