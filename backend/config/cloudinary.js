const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'prld-capstone',
  api_key: process.env.CLOUDINARY_API_KEY || '471123992644262',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Ry_Kc0Xj_Wd_Wd_Wd_Wd_Wd_Wd_Wd'
});

module.exports = cloudinary; 