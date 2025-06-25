const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Booking = require('../models/bookingModel');
const EMR = require('../models/emrModel');

function fallback(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    return value;
}

function getBookingStartTime(booking) {
    // If both are present and valid
    if (
        booking.bookingDate &&
        typeof booking.appointmentTime === 'string' &&
        booking.appointmentTime.includes(':')
    ) {
        const [hours, minutes] = booking.appointmentTime.split(':');
        if (!isNaN(Number(hours)) && !isNaN(Number(minutes))) {
            const date = new Date(booking.bookingDate);
            date.setHours(Number(hours), Number(minutes), 0, 0);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
    }
    // If only bookingDate is present
    if (booking.bookingDate && !booking.appointmentTime) {
        const date = new Date(booking.bookingDate);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    // If only appointmentTime is present
    if (!booking.bookingDate && typeof booking.appointmentTime === 'string' && booking.appointmentTime.includes(':')) {
        const [hours, minutes] = booking.appointmentTime.split(':');
        if (!isNaN(Number(hours)) && !isNaN(Number(minutes))) {
            const date = new Date();
            date.setHours(Number(hours), Number(minutes), 0, 0);
            return date.toISOString();
        }
    }
    // If neither is present or invalid
    return 'No date specified';
}

// Create new user
exports.createUser = async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        // Don't send password in response
        newUser.password = undefined;
        res.status(201).json({
            status: 'success',
            data: {
                user: newUser
            }
        });
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
        }
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
}; 

// Get user dashboard data
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this dashboard'
            });
        }

        // Use Promise.all for parallel execution
        const [pets, bookings] = await Promise.all([
            Pet.find({ owner: userId }),
            Booking.find({ petOwner: userId })
                .populate('pet', 'name type breed')
                .populate('clinic', 'clinicName email')
                .sort({ bookingDate: -1, appointmentTime: -1 })
        ]);

        const transformedBookings = bookings.map(b => {
            const startTime = getBookingStartTime(b);
            return {
                _id: b._id,
                pet: b.pet || 'N/A',
                clinic: b.clinic || 'N/A',
                startTime,
                status: fallback(b.status),
                notes: fallback(b.reason),
                type: b.type
            };
        });

        res.json({
            success: true,
            data: {
                pets,
                bookings: transformedBookings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

// Get user's pets
exports.getUserPets = async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.id });
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

// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await User.startSession();
        session.startTransaction();
        try {
            const pets = await Pet.find({ owner: userId });
            const petIds = pets.map(pet => pet._id);
            if (petIds.length > 0) {
                await EMR.deleteMany({ petId: { $in: petIds } }, { session });
            }
            await Pet.deleteMany({ owner: userId }, { session });
            await Booking.deleteMany({ petOwner: userId }, { session });
            const deletedUser = await User.findByIdAndDelete(userId).session(session);
            if (!deletedUser) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            await session.commitTransaction();
            session.endSession();
            res.json({
                success: true,
                message: 'Account and all associated data deleted successfully'
            });
            if (req.app && req.app.get('io')) {
                req.app.get('io').emit('users_updated');
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting account',
            error: error.message
        });
    }
};

// Search users by name or email
exports.searchUsers = async (req, res) => {
    try {
        const { query, role } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        
        // Build search criteria
        let searchCriteria = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        };
        
        // Add role filter if provided
        if (role) {
            searchCriteria.role = role;
        }
        
        const users = await User.find(searchCriteria)
            .select('-password')
            .limit(10); // Limit results to prevent large response
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error.message
        });
    }
};

// Get all approved clinics with their profiles
exports.getApprovedClinics = async (req, res) => {
    try {
        // Find all approved and verified clinics (support both status and isApproved fields)
        const clinics = await User.find({
            role: 'clinic',
            isVerified: true,
            $or: [
                { status: 'approved' },
                { isApproved: true }
            ]
        }).select('-password -otp -otpExpires');

        if (!clinics || clinics.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No approved clinics found"
            });
        }

        // Transform clinic data to match frontend expectations
        const clinicsWithFormattedData = clinics.map(clinic => ({
            _id: clinic._id,
            name: clinic.clinicName || clinic.fullName,
            description: clinic.description || 'No description available',
            address: clinic.address || clinic.location?.address || 'Address not provided',
            city: clinic.location?.city || 'City not provided',
            province: clinic.location?.province || 'Province not provided',
            zipCode: clinic.zipCode || clinic.location?.zipCode || 'Zip code not provided',
            contactNumber: clinic.contactNumber || 'Contact number not provided',
            landline: clinic.landline || 'Landline not provided',
            website: clinic.website || null,
            socialMedia: clinic.socialMedia || {},
            operatingHours: clinic.operatingHours || {},
            petsManaged: clinic.petsManaged || [],
            profilePicture: clinic.profilePicture || null,
            email: clinic.email,
            userType: clinic.userType || clinic.role
        }));

        res.status(200).json({
            success: true,
            data: clinicsWithFormattedData,
            message: "Clinics retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching approved clinics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};