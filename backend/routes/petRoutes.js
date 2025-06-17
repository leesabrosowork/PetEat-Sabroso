const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create new pet
router.post('/', petController.createPet);

// Get all pets for the authenticated user
router.get('/', petController.getUserPets);

// Get a single pet
router.get('/:id', petController.getPetById);

// Update a pet
router.put('/:id', petController.updatePet);

// Delete a pet
router.delete('/:id', petController.deletePet);

module.exports = router; 