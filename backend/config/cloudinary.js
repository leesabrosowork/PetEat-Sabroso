const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyscnbdva',
  api_key: process.env.CLOUDINARY_API_KEY || '641545256255234',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'RMnTNL5C5lOvik2skY1yebRanPs'
});

module.exports = cloudinary; 