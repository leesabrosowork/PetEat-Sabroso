const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vetClinicSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    unique: true,
    sparse: true,
    trim: true
  },
  landline: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    }
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  businessPermit: {
    type: String, // URL to the stored file
    required: [true, 'Business permit is required']
  },
  identificationCard: {
    type: String, // URL to the stored file
    required: [true, 'Identification card is required']
  },
  operatingHours: {
    mondayToFriday: {
      type: String,
      required: [true, 'Monday-Friday hours are required']
    },
    saturday: {
      type: String,
      required: [true, 'Saturday hours are required']
    },
    sunday: {
      type: String,
      required: [true, 'Sunday hours are required']
    }
  },
  petsManaged: [{
    type: String,
    required: [true, 'At least one pet type must be specified'],
    enum: ['Dogs', 'Cats', 'Birds', 'Small Mammals', 'Reptiles', 'Fish', 'Exotic Animals', 'Farm Animals', 'Wildlife']
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  needsOnboarding: {
    type: Boolean,
    default: true
  },
  otp: String,
  otpExpires: Date,
  role: {
    type: String,
    default: 'vet clinic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
vetClinicSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
vetClinicSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Create a 2dsphere index for location
vetClinicSchema.index({ 'location': '2dsphere' });

const VetClinic = mongoose.model('VetClinic', vetClinicSchema);

module.exports = VetClinic; 