const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Absolute path to media folder outside project
const uploadPath = path.join('/home/mesobfsj/media');

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    try {
      const fileName = Date.now() + path.extname(file.originalname);
      const filePath = path.join(uploadPath, fileName);

      // Pass file name back to multer first
      cb(null, fileName);

      // Optimize after multer writes the file
      process.nextTick(async () => {
        try {
          await sharp(filePath)
            .resize({ width: 800 }) // Max width 800px (keeps aspect ratio)
            .jpeg({ quality: 80 })  // Compress to 80% quality
            .toBuffer()
            .then(data => fs.writeFileSync(filePath, data));
        } catch (err) {
          console.error('Image optimization failed:', err);
        }
      });
    } catch (err) {
      cb(err);
    }
  }
});

// File filter (only allow certain image types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

module.exports = upload;

