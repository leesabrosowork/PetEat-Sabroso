const express = require('express');
const router = express.Router();
const {
    createEMR,
    getPetEMRs,
    getAllEMRs,
    getEMRById,
    updateEMR,
    deleteEMR
} = require('../controllers/emrController');
const { protect, authorize } = require('../middleware/auth');

// Vet Clinic routes
router.post('/', protect, authorize('vet clinic'), createEMR);
router.get('/', protect, authorize('vet clinic'), getAllEMRs);
router.get('/:id', protect, getEMRById);
router.put('/:id', protect, authorize('vet clinic'), updateEMR);
router.delete('/:id', protect, authorize('vet clinic'), deleteEMR);

// Common routes
router.get('/pet/:petId', protect, getPetEMRs);

// User routes - get EMRs for user's pets
router.get('/user/pets', protect, async (req, res) => {
    try {
        const Pet = require('../models/petModel');
        const EMR = require('../models/emrModel');
        const PetMedicalRecord = require('../models/petMedicalRecord');
        
        // Get user's pets
        const pets = await Pet.find({ owner: req.user._id });
        const petIds = pets.map(pet => pet._id);
        
        // Get EMRs from the EMR collection
        const emrs = await EMR.find({ petId: { $in: petIds } })
            .populate('clinic', 'clinicName email')
            .populate('petId', 'name type breed')
            .sort('-createdAt');
            
        // Get medical records from the PetMedicalRecord collection
        const petMedicalRecords = await PetMedicalRecord.find({ 
            petId: { $in: petIds.map(id => id.toString()) } 
        }).sort('-createdAt');
        
        // Transform PetMedicalRecord format to match EMR format for consistent frontend display
        const transformedPetMedicalRecords = petMedicalRecords.map(record => {
            const matchingPet = pets.find(pet => pet._id.toString() === record.petId);
            
            return {
                _id: record._id,
                petId: matchingPet ? {
                    _id: matchingPet._id,
                    name: matchingPet.name,
                    type: matchingPet.type || matchingPet.species,
                    breed: matchingPet.breed
                } : null,
                name: record.name,
                species: record.species,
                breed: record.breed,
                age: record.age,
                sex: record.sex,
                vaccinations: record.vaccinations || [],
                medicalHistory: record.medicalHistory || [],
                visitHistory: record.visitHistory || [],
                currentVisit: {
                    date: record.createdAt,
                    status: 'active',
                    notes: record.visitHistory && record.visitHistory.length > 0 
                        ? record.visitHistory[record.visitHistory.length - 1].notes 
                        : ''
                },
                clinic: {
                    name: record.visitHistory && record.visitHistory.length > 0 
                        ? record.visitHistory[record.visitHistory.length - 1].veterinarian 
                        : 'Veterinary Clinic',
                    email: ''
                },
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                recordType: 'petMedicalRecord' // Add a field to distinguish record types
            };
        });
        
        // Combine both types of records
        const allRecords = [...emrs, ...transformedPetMedicalRecords];
        
        // Sort by createdAt date, newest first
        allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            data: allRecords
        });
    } catch (error) {
        console.error('Error fetching EMRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching EMRs',
            error: error.message
        });
    }
});

module.exports = router; 