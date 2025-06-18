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
const { protect } = require('../middleware/authMiddleware');
const { doctorAuth } = require('../middleware/doctorAuth');

// Doctor routes
router.post('/', doctorAuth, createEMR);
router.get('/', doctorAuth, getAllEMRs);
router.get('/:id', protect, getEMRById);
router.put('/:id', doctorAuth, updateEMR);
router.delete('/:id', doctorAuth, deleteEMR);

// Common routes
router.get('/pet/:petId', protect, getPetEMRs);

// User routes - get EMRs for user's pets
router.get('/user/pets', protect, async (req, res) => {
    try {
        const Pet = require('../models/petModel');
        const EMR = require('../models/emrModel');
        
        // Get user's pets
        const pets = await Pet.find({ owner: req.user._id });
        const petIds = pets.map(pet => pet._id);
        
        // Get EMRs for all user's pets
        const emrs = await EMR.find({ petId: { $in: petIds } })
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed')
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
});

module.exports = router; 