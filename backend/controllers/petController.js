const Pet = require('../models/petModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Configure multer for temporary storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../temp');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
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

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'pet-pictures',
            use_filename: true
        });
        // Delete the temporary file
        fs.unlinkSync(file.path);
        return result.secure_url;
    } catch (error) {
        // Delete the temporary file in case of error
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw error;
    }
};

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
                    owner: req.user.id,
                    // Initialize empty arrays if not provided
                    medicalHistory: [],
                    vaccinations: []
                };

                // Convert string values to appropriate types
                if (petData.age) petData.age = Number(petData.age);
                if (petData.weight) petData.weight = Number(petData.weight);

                // Upload to Cloudinary if file was uploaded
                if (req.file) {
                    try {
                        petData.profilePicture = await uploadToCloudinary(req.file);
                    } catch (uploadError) {
                        return res.status(400).json({
                            success: false,
                            message: 'Error uploading image to cloud storage',
                            error: uploadError.message
                        });
                    }
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
        // Vet clinics and doctors need to see the full pet list, whereas individual pet owners
        // should only see their own pets. Populate owner data so that the frontend can
        // match against either `name` or `fullName`.
        if (req.user.role === 'doctor' || req.user.role === 'vet clinic') {
            pets = await Pet.find().populate('owner', 'name fullName email');
        } else {
            pets = await Pet.find({ owner: req.user.id }).populate('owner', 'name fullName email');
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

                // Upload to Cloudinary if file was uploaded
                if (req.file) {
                    try {
                        updateData.profilePicture = await uploadToCloudinary(req.file);
                    } catch (uploadError) {
                        return res.status(400).json({
                            success: false,
                            message: 'Error uploading image to cloud storage',
                            error: uploadError.message
                        });
                    }
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