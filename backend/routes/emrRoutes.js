const express = require('express');
const router = express.Router();
const {
    createEMR,
    getPetEMRs,
    getEMR,
    updateEMR,
    getDoctorEMRs,
    getUserEMRs,
    deleteEMR
} = require('../controllers/emrController');
const { protect } = require('../middleware/authMiddleware');
const { doctorAuth } = require('../middleware/doctorAuth');

// Doctor routes
router.post('/', doctorAuth, createEMR);
router.put('/:id', doctorAuth, updateEMR);
router.delete('/:id', doctorAuth, deleteEMR);
router.get('/doctor', doctorAuth, getDoctorEMRs);

// User routes
router.get('/user', protect, getUserEMRs);

// Common routes
router.get('/pet/:petId', protect, getPetEMRs);
router.get('/:id', protect, getEMR);

module.exports = router; 