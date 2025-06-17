const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { protect } = require('../middleware/auth');

// Create new pet
router.post('/', protect, petController.createPet);

// Get all pets for the authenticated user
router.get('/', protect, petController.getUserPets);

// Get a single pet
router.get('/:id', protect, petController.getPetById);

// Update a pet
router.put('/:id', protect, petController.updatePet);

// Delete a pet
router.delete('/:id', protect, petController.deletePet);

module.exports = router; 