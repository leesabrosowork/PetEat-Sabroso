const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const SuperAdmin = require('../models/superAdminModel');
const VetClinic = require('../models/vetClinicModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/business-permits')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF, JPEG, JPG & PNG files are allowed!');
    }
  }
}).single('businessPermit');

exports.signup = async (req, res) => {
    try {
        const { username, email, password, contactNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { contactNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 
                    'Email already in use' : 
                    'Contact number already in use'
            });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new user as not verified
        const newUser = await User.create({
            username,
            email,
            password, // Will be hashed by the pre-save middleware
            contactNumber,
            role: 'pet owner',
            isVerified: false,
            otp,
            otpExpires
        });

        // Send OTP email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: 'Your PetEat OTP Code',
            text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
        });

        res.status(201).json({
            success: true,
            message: 'Signup successful. Please check your email for the OTP to verify your account.',
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Try to find the user in each model
        const superAdmin = await SuperAdmin.findOne({ email }).select('+password');
        const user = await User.findOne({ email }).select('+password');
        const doctor = await Doctor.findOne({ email }).select('+password');
        const admin = await Admin.findOne({ email }).select('+password');
        const staff = await Staff.findOne({ email }).select('+password');
        const vetClinic = await VetClinic.findOne({ email }).select('+password');

        console.log('Found super admin:', superAdmin ? 'Yes' : 'No');
        console.log('Found user:', user ? 'Yes' : 'No');
        console.log('Found doctor:', doctor ? 'Yes' : 'No');
        console.log('Found admin:', admin ? 'Yes' : 'No');
        console.log('Found staff:', staff ? 'Yes' : 'No');
        console.log('Found vet clinic:', vetClinic ? 'Yes' : 'No');

        let authenticatedUser = null;
        let role = '';

        if (superAdmin) {
            console.log('Checking super admin password...');
            const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
            console.log('Super admin password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = superAdmin;
                role = 'super admin';
            }
        } else if (user) {
            console.log('Checking user password...');
            const isPasswordValid = await bcrypt.compare(password, user.password);
            console.log('User password valid:', isPasswordValid);
            if (isPasswordValid) {
                // Check if the user is verified
                if (!user.isVerified) {
                    return res.status(403).json({
                        success: false,
                        message: 'Please verify your email address before logging in. Check your email for the OTP.'
                    });
                }
                authenticatedUser = user;
                role = 'pet owner';
            }
        } else if (doctor) {
            console.log('Checking doctor password...');
            const isPasswordValid = await bcrypt.compare(password, doctor.password);
            console.log('Doctor password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = doctor;
                role = 'doctor';
            }
        } else if (admin) {
            console.log('Checking admin password...');
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            console.log('Admin password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = admin;
                role = 'admin';
            }
        } else if (staff) {
            console.log('Checking staff password...');
            const isPasswordValid = await bcrypt.compare(password, staff.password);
            console.log('Staff password valid:', isPasswordValid);
            if (isPasswordValid) {
                authenticatedUser = staff;
                role = 'staff';
            }
        } else if (vetClinic) {
            console.log('Checking vet clinic password...');
            const isPasswordValid = await bcrypt.compare(password, vetClinic.password);
            console.log('Vet clinic password valid:', isPasswordValid);
            if (isPasswordValid) {
                // Check if the clinic is approved
                if (vetClinic.status !== 'approved') {
                    return res.status(403).json({
                        success: false,
                        message: vetClinic.status === 'pending' 
                            ? 'Your account is pending approval. Please wait for the super admin to review your application.'
                            : `Your account has been rejected. Reason: ${vetClinic.rejectionReason || 'No reason provided'}`
                    });
                }
                authenticatedUser = vetClinic;
                role = 'vet clinic';
            }
        }

        if (!authenticatedUser) {
            console.log('No authenticated user found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: authenticatedUser._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Remove password from response
        authenticatedUser.password = undefined;

        console.log('Login successful for role:', role);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: authenticatedUser, role, token }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.vetClinicSignup = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err
      });
    }

    try {
      const {
        clinicName,
        ownerName,
        email,
        password,
        phoneNumber,
        address,
        licenseNumber,
        clinicType,
        openingHours,
        servicesOffered,
        animalsCatered
      } = req.body;

      // Check if clinic already exists
      const existingClinic = await VetClinic.findOne({
        $or: [
          { email },
          { phoneNumber },
          { licenseNumber }
        ]
      });

      if (existingClinic) {
        return res.status(400).json({
          success: false,
          message: existingClinic.email === email ? 
            'Email already in use' : 
            existingClinic.phoneNumber === phoneNumber ?
            'Phone number already in use' :
            'License number already in use'
        });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create new clinic as not verified
      const newClinic = await VetClinic.create({
        clinicName,
        ownerName,
        email,
        password,
        phoneNumber,
        location: {
          address: JSON.parse(address).address || '',
          city: JSON.parse(address).city || '',
          province: JSON.parse(address).province || '',
          zipCode: JSON.parse(address).zipCode || ''
        },
        licenseNumber,
        businessPermit: req.file ? `/uploads/business-permits/${req.file.filename}` : null,
        clinicType,
        openingHours: openingHours ? JSON.parse(openingHours) : {
          monday: { isOpen: true, start: "08:00", end: "18:00" },
          tuesday: { isOpen: true, start: "08:00", end: "18:00" },
          wednesday: { isOpen: true, start: "08:00", end: "18:00" },
          thursday: { isOpen: true, start: "08:00", end: "18:00" },
          friday: { isOpen: true, start: "08:00", end: "18:00" },
          saturday: { isOpen: true, start: "09:00", end: "15:00" },
          sunday: { isOpen: false, start: "09:00", end: "15:00" }
        },
        servicesOffered: servicesOffered ? JSON.parse(servicesOffered) : [],
        animalsCatered: animalsCatered ? JSON.parse(animalsCatered) : [],
        isVerified: false,
        otp,
        otpExpires
      });

      // Send OTP email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: newClinic.email,
        subject: 'Your PetEat Veterinary Clinic OTP Code',
        text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
      });

      res.status(201).json({
        success: true,
        message: 'Signup successful. Please check your email for the OTP to verify your account.',
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
}; 