const EMR = require('../models/emrModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');
const PetMedicalRecord = require('../models/petMedicalRecord');

// @desc    Create new EMR
// @route   POST /api/emr
// @access  Private/Doctor
exports.createEMR = async (req, res) => {
    try {
        const {
            petId,
            name,
            species,
            breed,
            age,
            sex,
            vaccinations,
            medicalHistory,
            visitHistory,
            currentVisit,
            attachments
        } = req.body;

        const pet = await Pet.findById(petId).populate('owner');
        console.log('Populated pet:', JSON.stringify(pet, null, 2));
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Always create a new EMR (allow multiple EMRs per pet)
        const emr = await EMR.create({
            petId,
            name: name || pet.name,
            species: species || pet.type || pet.species,
            breed: breed || pet.breed,
            age: age || pet.age,
            sex: sex || pet.gender || pet.sex,
            owner: {
                name: pet.owner?.fullName || pet.owner?.name || 'Unknown',
                phone: pet.owner?.contactNumber || pet.owner?.phone || 'Not provided',
                email: pet.owner?.email || 'Not provided',
                address: pet.owner?.address || ''
            },
            vaccinations: vaccinations || [],
            medicalHistory: medicalHistory || [],
            visitHistory: visitHistory || [],
            currentVisit,
            doctor: req.user._id,
            attachments: attachments || []
        });

        // Populate the response
        await emr.populate('doctor', 'name email');

        res.status(201).json({
            success: true,
            data: emr
        });
    } catch (error) {
        console.error('EMR creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating EMR',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for a pet
// @route   GET /api/emr/pet/:petId
// @access  Private
exports.getPetEMRs = async (req, res) => {
    try {
        const petId = req.params.petId;
        
        // Get EMRs from EMR collection
        const emrs = await EMR.find({ petId })
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner')
            .sort('-createdAt');
            
        // Get records from PetMedicalRecord collection
        const petMedicalRecords = await PetMedicalRecord.find({ petId: petId.toString() })
            .sort('-createdAt');
            
        // Get the pet details for transforming records
        const pet = await Pet.findById(petId);
        
        // Transform PetMedicalRecord format to match EMR format
        const transformedPetMedicalRecords = petMedicalRecords.map(record => {
            return {
                _id: record._id,
                petId: {
                    _id: pet._id,
                    name: pet.name,
                    type: pet.type || pet.species,
                    breed: pet.breed,
                    owner: pet.owner
                },
                name: record.name,
                species: record.species,
                breed: record.breed,
                age: record.age,
                sex: record.sex,
                vaccinations: record.vaccinations || [],
                medicalHistory: record.medicalHistory || [],
                visitHistory: record.visitHistory || [],
                currentVisit: {
                    date: record.createdAt,
                    status: 'active',
                    notes: record.visitHistory && record.visitHistory.length > 0 
                        ? record.visitHistory[record.visitHistory.length - 1].notes 
                        : ''
                },
                doctor: {
                    name: record.visitHistory && record.visitHistory.length > 0 
                        ? record.visitHistory[record.visitHistory.length - 1].veterinarian 
                        : 'Unknown',
                    email: ''
                },
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                recordType: 'petMedicalRecord' // Add a field to distinguish record types
            };
        });
        
        // Combine both types of records
        const allRecords = [...emrs, ...transformedPetMedicalRecords];
        
        // Sort by createdAt date, newest first
        allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: allRecords
        });
    } catch (error) {
        console.error('Error fetching pet EMRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching EMRs',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for doctor
// @route   GET /api/emr
// @access  Private/Doctor
exports.getAllEMRs = async (req, res) => {
    try {
        const emrs = await EMR.find({ doctor: req.user._id })
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner')
            .sort('-updatedAt');

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
};

// @desc    Get single EMR by ID
// @route   GET /api/emr/:id
// @access  Private
exports.getEMRById = async (req, res) => {
    try {
        // First try to find in EMR collection
        let emr = await EMR.findById(req.params.id)
            .populate('doctor', 'name email')
            .populate('petId', 'name type breed owner');

        // If not found in EMR collection, try PetMedicalRecord collection
        if (!emr) {
            const petMedicalRecord = await PetMedicalRecord.findById(req.params.id);
            
            if (petMedicalRecord) {
                // Get the pet details
                const pet = await Pet.findOne({ _id: petMedicalRecord.petId });
                
                if (!pet) {
                    return res.status(404).json({
                        success: false,
                        message: 'Pet not found for this medical record'
                    });
                }
                
                // Transform to match EMR format
                emr = {
                    _id: petMedicalRecord._id,
                    petId: {
                        _id: pet._id,
                        name: pet.name,
                        type: pet.type || pet.species,
                        breed: pet.breed,
                        owner: pet.owner
                    },
                    name: petMedicalRecord.name,
                    species: petMedicalRecord.species,
                    breed: petMedicalRecord.breed,
                    age: petMedicalRecord.age,
                    sex: petMedicalRecord.sex,
                    vaccinations: petMedicalRecord.vaccinations || [],
                    medicalHistory: petMedicalRecord.medicalHistory || [],
                    visitHistory: petMedicalRecord.visitHistory || [],
                    currentVisit: {
                        date: petMedicalRecord.createdAt,
                        status: 'active',
                        notes: petMedicalRecord.visitHistory && petMedicalRecord.visitHistory.length > 0 
                            ? petMedicalRecord.visitHistory[petMedicalRecord.visitHistory.length - 1].notes 
                            : ''
                    },
                    doctor: {
                        name: petMedicalRecord.visitHistory && petMedicalRecord.visitHistory.length > 0 
                            ? petMedicalRecord.visitHistory[petMedicalRecord.visitHistory.length - 1].veterinarian 
                            : 'Unknown',
                        email: ''
                    },
                    createdAt: petMedicalRecord.createdAt,
                    updatedAt: petMedicalRecord.updatedAt,
                    recordType: 'petMedicalRecord'
                };
            }
        }

        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        res.json({
            success: true,
            data: emr
        });
    } catch (error) {
        console.error('Error fetching EMR by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching EMR',
            error: error.message
        });
    }
};

// @desc    Update EMR
// @route   PUT /api/emr/:id
// @access  Private/Doctor
exports.updateEMR = async (req, res) => {
    try {
        const emr = await EMR.findById(req.params.id);
        
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Check if doctor owns this EMR
        if (emr.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this EMR'
            });
        }

        const updatedEMR = await EMR.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('doctor', 'name email');

        res.json({
            success: true,
            data: updatedEMR
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating EMR',
            error: error.message
        });
    }
};

// @desc    Delete EMR
// @route   DELETE /api/emr/:id
// @access  Private/Doctor
exports.deleteEMR = async (req, res) => {
    try {
        const emr = await EMR.findById(req.params.id);
        
        if (!emr) {
            return res.status(404).json({
                success: false,
                message: 'EMR not found'
            });
        }

        // Allow any clinic user to delete any EMR
        await EMR.findByIdAndDelete(req.params.id);
        return res.json({
            success: true,
            message: 'EMR deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting EMR',
            error: error.message
        });
    }
};

// @desc    Get all EMRs for user's pets
// @route   GET /api/emr/user/pets
// @access  Private
exports.getUserPetsEMRs = async (req, res) => {
    try {
        // First get all pets owned by the user
        const pets = await Pet.find({ owner: req.user._id });
        const petIds = pets.map(pet => pet._id);

        // Then get all EMRs for these pets
        const emrs = await EMR.find({ petId: { $in: petIds } })
            .populate('doctor', 'name email')
            .populate({
                path: 'petId',
                populate: {
                    path: 'owner',
                    select: 'name email phone'
                }
            })
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
};

// Archive or unarchive an EMR
exports.archiveEMR = async (req, res) => {
    try {
        const { id } = req.params;
        const { archived } = req.body;
        const emr = await EMR.findByIdAndUpdate(id, { archived: !!archived }, { new: true });
        if (!emr) {
            return res.status(404).json({ success: false, message: 'EMR not found' });
        }
        res.json({ success: true, data: emr });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error archiving EMR', error: error.message });
    }
};

