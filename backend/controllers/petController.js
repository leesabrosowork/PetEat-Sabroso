const Pet = require('../models/petModel');

// Create new pet
exports.createPet = async (req, res) => {
    try {
        // Add the owner ID from the authenticated user
        const petData = {
            ...req.body,
            owner: req.user.id
        };

        const newPet = await Pet.create(petData);
        
        res.status(201).json({
            success: true,
            message: 'Pet registered successfully',
            data: newPet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error registering pet',
            error: error.message
        });
    }
};

// Get all pets for the authenticated user
exports.getUserPets = async (req, res) => {
    try {
        console.log('req.user in getUserPets:', req.user);
        let pets;
        if (req.user.role === 'doctor') {
            pets = await Pet.find().populate('owner');
        } else {
            pets = await Pet.find({ owner: req.user.id });
        }
        console.log('Pets being sent:', pets);
        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pets',
            error: error.message
        });
    }
};

// Get a single pet by ID
exports.getPetById = async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, owner: req.user.id });
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }

        res.json({
            success: true,
            data: pet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pet',
            error: error.message
        });
    }
};

// Update a pet
exports.updatePet = async (req, res) => {
    try {
        const pet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }

        res.json({
            success: true,
            message: 'Pet updated successfully',
            data: pet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating pet',
            error: error.message
        });
    }
};

// Delete a pet
exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found or does not belong to you'
            });
        }

        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting pet',
            error: error.message
        });
    }
}; 