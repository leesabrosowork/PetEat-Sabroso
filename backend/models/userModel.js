const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        },
        minlength: 8,
        select: false // Don't include password in queries by default
    },
    showPassword: {
        type: Boolean,
        default: false,
        description: "User preference for showing/hiding password during input"
    },
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        sparse: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['pet owner', 'clinic', 'admin', 'super admin'],
        default: 'pet owner'
    },
    profilePicture: {
        type: String,
        default: ''
    },
    address: {
        type: String
    },
    // Fields for clinic users
    clinicName: {
        type: String,
        required: function() {
            return this.role === 'clinic';
        }
    },
    description: {
        type: String
    },
    licenseNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function(value) {
                if (this.role === 'clinic') {
                    return typeof value === 'string' && value.trim().length > 0;
                }
                return true;
            },
            message: 'License number is required for clinics.'
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: { type: String },
        city: { type: String },
        province: { type: String },
        zipCode: { type: String }
    },
    landline: { type: String },
    website: { type: String },
    socialMedia: {
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String }
    },
    businessPermit: { type: String },
    identificationCard: { type: String },
    operatingHours: {
        mondayToFriday: { type: String },
        saturday: { type: String },
        sunday: { type: String }
    },
    petsManaged: [{
        type: String,
        enum: ['Dogs', 'Cats', 'Birds', 'Small Mammals', 'Reptiles', 'Fish', 'Exotic Animals', 'Farm Animals', 'Wildlife']
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: { type: String },
    // Relationships
    pets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }],
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    // Authentication and verification
    isVerified: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: Boolean,
        default: function() {
            // Always approved for pet owners, only clinics require approval
            return this.role !== 'clinic';
        }
    },
    googleId: {
        type: String
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    rememberToken: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    needsOnboarding: {
        type: Boolean,
        default: true
    },
    completedOnboarding: {
        type: Boolean,
        default: false
    },
    googleTokens: {
        type: Object,
        default: null
    }
}, {
    timestamps: true
});

// Create indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ contactNumber: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        if (this.role === 'pet owner') {
            this.isApproved = true;
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if a password meets requirements
userSchema.statics.validatePassword = function(password) {
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
};

// Method to validate email format
userSchema.statics.validateEmail = function(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

// Method to generate password reset token
userSchema.methods.generateResetToken = async function() {
    const token = require('crypto').randomBytes(20).toString('hex');
    
    this.resetPasswordToken = token;
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await this.save();
    return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User; 