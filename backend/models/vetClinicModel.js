const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vetClinicSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
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
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  location: {
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
  businessPermit: {
    type: String, // URL to the stored file
    required: [true, 'Business permit is required']
  },
  clinicType: {
    type: String,
    required: [true, 'Clinic type is required'],
    enum: ['Small Animal Practice', 'Mixed Practice', 'Emergency Clinic', 'Specialty Clinic', 'Mobile Practice']
  },
  openingHours: {
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
  servicesOffered: [{
    type: String,
    trim: true
  }],
  animalsCatered: [{
    type: String,
    required: [true, 'At least one animal type must be specified'],
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

const VetClinic = mongoose.model('VetClinic', vetClinicSchema);

module.exports = VetClinic; 