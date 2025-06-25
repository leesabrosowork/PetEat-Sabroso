const express = require('express');
const router = express.Router();
const videoConsultationController = require('../controllers/videoConsultationController');
const { protect, authorize } = require('../middleware/auth');

// Create new video consultation
router.post('/', protect, videoConsultationController.createVideoConsultation);

// Get all video consultations for the authenticated user
router.get('/user', protect, videoConsultationController.getUserVideoConsultations);

// Get a single video consultation by ID
router.get('/:id', protect, videoConsultationController.getVideoConsultationById);

// Update status of a video consultation
router.patch('/:id/status', protect, videoConsultationController.updateVideoConsultationStatus);

// Get consultation details with fallback for missing info
router.get('/:id/details', protect, videoConsultationController.getConsultationDetails);

module.exports = router; 