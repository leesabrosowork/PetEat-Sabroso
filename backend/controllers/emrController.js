const EMR = require('../models/emrModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');

// @desc    Create new EMR
// @route   POST /api/emr
// @access  Private/Doctor
exports.createEMR = async (req, res) => {
    try {
        const {
            petId,
            name,
            species,
            breed,
            age,
            sex,
            vaccinations,
            medicalHistory,
            visitHistory,
            currentVisit,
            attachments
        } = req.body;

        const pet = await Pet.findById(petId).populate('owner');
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Always create a new EMR (allow multiple EMRs per pet)
        const emr = await EMR.create({
            petId,
            name: name || pet.name,
            species: species || pet.type || pet.species,
            breed: breed || pet.breed,
            age: age || pet.age,
            sex: sex || pet.gender || pet.sex,
            vaccinations: vaccinations || [],
            medicalHistory: medicalHistory || [],
            visitHistory: visitHistory || [],
            currentVisit,
            doctor: req.user._id,
            attachments: attachments || []
        });

        // Populate the response
        await emr.populate('doctor', 'name email');

        res.status(201).json({
            success: true,
            data: emr
        });
    } catch (error) {
        console.error('EMR creation error:', error);
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
        const emrs = await EMR.find({ petId: req.params.petId })
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner')
            .sort('-createdAt');

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

// @desc    Get all EMRs for doctor
// @route   GET /api/emr
// @access  Private/Doctor
exports.getAllEMRs = async (req, res) => {
    try {
        const emrs = await EMR.find({ doctor: req.user._id })
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner')
            .sort('-updatedAt');

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

// @desc    Get single EMR by ID
// @route   GET /api/emr/:id
// @access  Private
exports.getEMRById = async (req, res) => {
    try {
        const emr = await EMR.findById(req.params.id)
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner');

        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
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
        const emr = await EMR.findById(req.params.id);
        
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Check if doctor owns this EMR
        if (emr.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this EMR'
            });
        }

        const updatedEMR = await EMR.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('doctor', 'name email');

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

// @desc    Delete EMR
// @route   DELETE /api/emr/:id
// @access  Private/Doctor
exports.deleteEMR = async (req, res) => {
    try {
        const emr = await EMR.findById(req.params.id);
        
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Check if doctor owns this EMR
        if (emr.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this EMR'
            });
        }

        await EMR.findByIdAndDelete(req.params.id);

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

// @desc    Get all EMRs for user's pets
// @route   GET /api/emr/user/pets
// @access  Private
exports.getUserPetsEMRs = async (req, res) => {
    try {
        // First get all pets owned by the user
        const pets = await Pet.find({ owner: req.user._id });
        const petIds = pets.map(pet => pet._id);

        // Then get all EMRs for these pets
        const emrs = await EMR.find({ petId: { $in: petIds } })
            .populate('doctor', 'name email')
            .populate({
                path: 'petId',
                populate: {
                    path: 'owner',
                    select: 'name email phone'
                }
            })
            .sort('-createdAt');

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

