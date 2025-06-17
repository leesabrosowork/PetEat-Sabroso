const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/vet-signup', authController.vetClinicSignup);
router.post('/login', authController.login);

module.exports = router; 