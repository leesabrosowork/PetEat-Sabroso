const User = require('../models/userModel');
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
}).fields([
  { name: 'businessPermit', maxCount: 1 },
  { name: 'identificationCard', maxCount: 1 }
]);

exports.signup = async (req, res) => {
    try {
        const { username, email, password, contactNumber, fullName, address } = req.body;

        console.log("User Signup - Contact Number:", contactNumber);

        // Check if email already exists in ANY user model
        const [existingUser, existingAdmin, existingStaff, existingSuperAdmin, existingVetClinic] = await Promise.all([
            User.findOne({ email }),
            Admin.findOne({ email }),
            Staff.findOne({ email }),
            SuperAdmin.findOne({ email }),
            VetClinic.findOne({ email })
        ]);

        if (existingUser || existingAdmin || existingStaff || existingSuperAdmin || existingVetClinic) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email address.'
            });
        }

        // Check if contact number exists in any model
        if (contactNumber) {
            console.log("Checking for duplicate contact number:", contactNumber);
            const [userWithSameContact, adminWithSameContact, staffWithSameContact, vetClinicWithSameContact] = await Promise.all([
                User.findOne({ contactNumber }),
                Admin.findOne({ contactNumber }),
                Staff.findOne({ contactNumber }),
                VetClinic.findOne({ contactNumber })
            ]);

            if (userWithSameContact) console.log("Found duplicate contact in User model");
            if (adminWithSameContact) console.log("Found duplicate contact in Admin model");
            if (staffWithSameContact) console.log("Found duplicate contact in Staff model");
            if (vetClinicWithSameContact) console.log("Found duplicate contact in VetClinic model");

            if (userWithSameContact || adminWithSameContact || staffWithSameContact || vetClinicWithSameContact) {
                return res.status(400).json({
                    success: false,
                    message: 'Contact number already in use. Please use a different contact number.'
                });
            }
        }

        // Check if username already exists
        const existingUserData = await User.findOne({ username });

        if (existingUserData) {
            return res.status(400).json({
                success: false,
                message: 'Username already in use'
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
            fullName,
            address,
            role: 'pet owner',
            isVerified: false,
            otp,
            otpExpires,
            needsOnboarding: true
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
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred during signup.'
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
        const admin = await Admin.findOne({ email }).select('+password');
        const staff = await Staff.findOne({ email }).select('+password');
        const vetClinic = await VetClinic.findOne({ email }).select('+password');

        console.log('Found super admin:', superAdmin ? 'Yes' : 'No');
        console.log('Found user:', user ? 'Yes' : 'No');
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
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.toString()
      });
    }

    try {
      const {
        clinicName,
        fullName,
        username,
        email,
        password,
        contactNumber,
        landline,
        location,
        licenseNumber,
        description,
        website,
        socialMedia,
        operatingHours,
        petsManaged
      } = req.body;

      console.log("Vet Clinic Signup - Contact Number:", contactNumber);

      // Check if email already exists in ANY user model
      const [existingUser, existingAdmin, existingStaff, existingSuperAdmin, existingVetClinic] = await Promise.all([
        User.findOne({ email }),
        Admin.findOne({ email }),
        Staff.findOne({ email }),
        SuperAdmin.findOne({ email }),
        VetClinic.findOne({ email })
      ]);

      if (existingUser || existingAdmin || existingStaff || existingSuperAdmin || existingVetClinic) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email address.'
        });
      }

      // Check if contact number exists in any model
      if (contactNumber) {
        console.log("Checking for duplicate contact number:", contactNumber);
        const [userWithSameContact, adminWithSameContact, staffWithSameContact, vetClinicWithSameContact] = await Promise.all([
          User.findOne({ contactNumber }),
          Admin.findOne({ contactNumber }),
          Staff.findOne({ contactNumber }),
          VetClinic.findOne({ contactNumber })
        ]);

        if (userWithSameContact) console.log("Found duplicate contact in User model");
        if (adminWithSameContact) console.log("Found duplicate contact in Admin model");
        if (staffWithSameContact) console.log("Found duplicate contact in Staff model");
        if (vetClinicWithSameContact) console.log("Found duplicate contact in VetClinic model");

        if (userWithSameContact || adminWithSameContact || staffWithSameContact || vetClinicWithSameContact) {
          return res.status(400).json({
            success: false,
            message: 'Contact number already in use. Please use a different contact number.'
          });
        }
      }

      // Check if username or license number already exists
      const existingClinicData = await VetClinic.findOne({
        $or: [
          { username },
          { licenseNumber }
        ]
      });

      if (existingClinicData) {
        return res.status(400).json({
          success: false,
          message: existingClinicData.username === username ?
            'Username already in use' :
            'License number already in use'
        });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create new clinic as not verified
      const newClinic = await VetClinic.create({
        clinicName,
        fullName,
        username,
        email,
        password,
        contactNumber,
        landline,
        location: JSON.parse(location),
        licenseNumber,
        description,
        website,
        socialMedia: JSON.parse(socialMedia),
        businessPermit: req.files?.businessPermit ? `/uploads/business-permits/${req.files.businessPermit[0].filename}` : null,
        identificationCard: req.files?.identificationCard ? `/uploads/business-permits/${req.files.identificationCard[0].filename}` : null,
        operatingHours: JSON.parse(operatingHours),
        petsManaged: JSON.parse(petsManaged),
        status: 'pending',
        isVerified: false,
        otp,
        otpExpires,
        needsOnboarding: true
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
      console.error('Vet clinic signup error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'An error occurred during signup.'
      });
    }
  });
}; 