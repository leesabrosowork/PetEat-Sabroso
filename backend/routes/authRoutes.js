const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
// This now creates a user with role: clinic in the users collection.
router.post('/vet-signup', authController.vetClinicSignup);
router.post('/login', authController.login);

module.exports = router; 