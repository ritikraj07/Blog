// middlewares/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Cloudinary storage configuration for Multer
 * Automatically optimizes images and stores in 'blog-images' folder
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog-images',
    format: async (req, file) => 'webp', // Convert to modern WebP format
    transformation: [
      { width: 1200, height: 630, crop: 'limit' }, // Optimal blog image size
      { quality: 'auto:good' } // Auto-optimize quality
    ],
    public_id: (req, file) => {
      // Generate unique filename to avoid conflicts
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return 'blog-' + uniqueSuffix;
    },
  },
});

/**
 * Multer middleware for file upload
 * - Only accepts image files
 * - Limits file size to 5MB
 * - Uses Cloudinary for storage
 */
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = { upload, cloudinary };