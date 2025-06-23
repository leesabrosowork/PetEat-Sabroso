const PetsUnderTreatment = require('../models/petsUnderTreatmentModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');
const { io } = require('../server');

// Get all pets under treatment (for superadmin)
exports.getAllPetsUnderTreatment = async (req, res) => {
    try {
        const petsUnderTreatment = await PetsUnderTreatment.find({ discharged: false })
            .populate({
                path: 'pet',
                select: 'name type breed age gender color profilePicture owner',
                populate: {
                    path: 'owner',
                    select: 'name email contactNumber'
                }
            })
            .populate('clinic', 'name address contactNumber email')
            .sort({ admissionDate: -1 });

        res.json({
            success: true,
            data: petsUnderTreatment
        });
    } catch (error) {
        console.error('Error in getAllPetsUnderTreatment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get pets under treatment for a specific clinic
exports.getClinicPetsUnderTreatment = async (req, res) => {
    try {
        const clinicId = req.user._id; // Assuming this is accessed by a vet clinic user
        
        const petsUnderTreatment = await PetsUnderTreatment.find({ 
            clinic: clinicId,
            discharged: false
        })
        .populate({
            path: 'pet',
            select: 'name type breed age gender color profilePicture owner',
            populate: {
                path: 'owner',
                select: 'name email contactNumber'
            }
        })
        .populate('clinic', 'name address contactNumber email')
        .sort({ admissionDate: -1 });

        res.json({
            success: true,
            data: petsUnderTreatment
        });
    } catch (error) {
        console.error('Error in getClinicPetsUnderTreatment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get pets under treatment for a specific user
exports.getUserPetsUnderTreatment = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming this is accessed by a pet owner
        
        // First get all pets owned by this user
        const userPets = await Pet.find({ owner: userId }).select('_id');
        const petIds = userPets.map(pet => pet._id);
        
        const petsUnderTreatment = await PetsUnderTreatment.find({ 
            pet: { $in: petIds },
            discharged: false
        })
        .populate('pet', 'name type breed age gender color profilePicture')
        .populate('clinic', 'name address contactNumber email')
        .sort({ lastUpdated: -1 });

        res.json({
            success: true,
            data: petsUnderTreatment
        });
    } catch (error) {
        console.error('Error in getUserPetsUnderTreatment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add a new pet under treatment (by vet clinic)
exports.addPetUnderTreatment = async (req, res) => {
    try {
        const { petId, room, diagnosis, clinicalNotes, expectedDischargeDate } = req.body;
        
        // Check if pet exists
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        // Check if pet is already under treatment at this clinic
        const existingTreatment = await PetsUnderTreatment.findOne({
            pet: petId,
            clinic: req.user._id,
            discharged: false
        });
        
        if (existingTreatment) {
            return res.status(400).json({
                success: false,
                message: 'Pet is already under treatment at this clinic'
            });
        }
        
        const newPetUnderTreatment = new PetsUnderTreatment({
            pet: petId,
            clinic: req.user._id,
            room,
            diagnosis: diagnosis || '',
            clinicalNotes: clinicalNotes || '',
            expectedDischargeDate: expectedDischargeDate || null,
            treatmentHistory: [{
                notes: 'Pet admitted for treatment',
                updatedBy: req.user._id
            }]
        });
        
        await newPetUnderTreatment.save();
        
        // Populate the saved entry for response
        await newPetUnderTreatment.populate([
            {
                path: 'pet',
                select: 'name type breed age gender color profilePicture owner',
                populate: {
                    path: 'owner',
                    select: 'name email contactNumber'
                }
            },
            {
                path: 'clinic',
                select: 'name address contactNumber email'
            }
        ]);
        
        // Emit socket event
        if (io) {
            io.emit('pets_under_treatment_updated');
        }
        
        res.status(201).json({
            success: true,
            data: newPetUnderTreatment
        });
    } catch (error) {
        console.error('Error in addPetUnderTreatment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update treatment status (by vet clinic)
exports.updateTreatmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, clinicalNotes, room, expectedDischargeDate } = req.body;
        
        const petUnderTreatment = await PetsUnderTreatment.findById(id);
        
        if (!petUnderTreatment) {
            return res.status(404).json({
                success: false,
                message: 'Treatment record not found'
            });
        }
        
        // Verify that this clinic owns this record
        if (petUnderTreatment.clinic.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this treatment record'
            });
        }
        
        // Update fields
        if (status) petUnderTreatment.status = status;
        if (room) petUnderTreatment.room = room;
        if (expectedDischargeDate) petUnderTreatment.expectedDischargeDate = expectedDischargeDate;
        if (clinicalNotes) petUnderTreatment.clinicalNotes = clinicalNotes;
        
        // Add to treatment history
        petUnderTreatment.treatmentHistory.push({
            notes: `Status updated to ${status || 'unchanged'}. ${clinicalNotes || ''}`,
            updatedBy: req.user._id
        });
        
        await petUnderTreatment.save();
        
        // Populate the saved entry for response
        await petUnderTreatment.populate([
            {
                path: 'pet',
                select: 'name type breed age gender color profilePicture owner',
                populate: {
                    path: 'owner',
                    select: 'name email contactNumber'
                }
            },
            {
                path: 'clinic',
                select: 'name address contactNumber email'
            }
        ]);
        
        // Emit socket event
        if (io) {
            io.emit('pets_under_treatment_updated');
        }
        
        res.json({
            success: true,
            data: petUnderTreatment
        });
    } catch (error) {
        console.error('Error in updateTreatmentStatus:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Discharge a pet (by vet clinic)
exports.dischargePet = async (req, res) => {
    try {
        const { id } = req.params;
        const { dischargeNotes } = req.body;
        
        const petUnderTreatment = await PetsUnderTreatment.findById(id);
        
        if (!petUnderTreatment) {
            return res.status(404).json({
                success: false,
                message: 'Treatment record not found'
            });
        }
        
        // Verify that this clinic owns this record
        if (petUnderTreatment.clinic.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to discharge this pet'
            });
        }
        
        // Update discharge fields
        petUnderTreatment.discharged = true;
        petUnderTreatment.dischargedDate = new Date();
        petUnderTreatment.status = 'Recovered';
        
        // Add to treatment history
        petUnderTreatment.treatmentHistory.push({
            notes: `Pet discharged. ${dischargeNotes || ''}`,
            updatedBy: req.user._id
        });
        
        await petUnderTreatment.save();
        
        // Emit socket event
        if (io) {
            io.emit('pets_under_treatment_updated');
        }
        
        res.json({
            success: true,
            message: 'Pet discharged successfully',
            data: petUnderTreatment
        });
    } catch (error) {
        console.error('Error in dischargePet:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get treatment details for a specific pet (by vet clinic or pet owner)
exports.getTreatmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const petUnderTreatment = await PetsUnderTreatment.findById(id)
            .populate({
                path: 'pet',
                select: 'name type breed age gender color profilePicture owner',
                populate: {
                    path: 'owner',
                    select: 'name email contactNumber'
                }
            })
            .populate('clinic', 'name address contactNumber email')
            .populate('treatmentHistory.updatedBy', 'name');
        
        if (!petUnderTreatment) {
            return res.status(404).json({
                success: false,
                message: 'Treatment record not found'
            });
        }
        
        // If request is from a user, verify they own this pet
        if (req.user.role === 'user') {
            const userId = req.user._id;
            const pet = await Pet.findById(petUnderTreatment.pet._id);
            
            if (!pet || pet.owner.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this treatment record'
                });
            }
        }
        
        // If request is from a clinic, verify they own this record
        if ((req.user.role === 'clinic' || req.user.userType === 'clinic') && 
            petUnderTreatment.clinic._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this treatment record'
            });
        }
        
        res.json({
            success: true,
            data: petUnderTreatment
        });
    } catch (error) {
        console.error('Error in getTreatmentDetails:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 