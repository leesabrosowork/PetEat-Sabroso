const Pet = require('../models/petModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for pet picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/pet-pictures');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Create new pet
exports.createPet = async (req, res) => {
    try {
        // Handle file upload if present
        upload.single('profilePicture')(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            }

            try {
                // Add the owner ID from the authenticated user
                const petData = {
                    ...req.body,
                    owner: req.user.id
                };

                // Add profile picture path if file was uploaded
                if (req.file) {
                    petData.profilePicture = `uploads/pet-pictures/${req.file.filename}`;
                }

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
        // Handle file upload if present
        upload.single('profilePicture')(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            }

            try {
                const updateData = { ...req.body };

                // Add profile picture path if file was uploaded
                if (req.file) {
                    updateData.profilePicture = `uploads/pet-pictures/${req.file.filename}`;
                }

                const pet = await Pet.findOneAndUpdate(
                    { _id: req.params.id, owner: req.user.id },
                    updateData,
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

        // Delete profile picture if it exists
        if (pet.profilePicture) {
            const filePath = path.join(__dirname, '..', pet.profilePicture);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
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