import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { thumbnailService } from '../services/thumbnailService';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type
    let subDir = 'documents';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    }
    
    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'files-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
  // Allow specific file types
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to get file URL
export const getFileUrl = (filename: string, type: string): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Enhanced upload middleware that generates thumbnails for images
export const uploadWithThumbnails = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
}).single('file');

// Middleware to process uploaded files and generate thumbnails
export const processUploadedFile = async (req: any, res: any, next: any) => {
  try {
    if (!req.file) {
      return next();
    }

    // Generate thumbnail for image files
    if (thumbnailService.isImageFile(req.file.mimetype)) {
      try {
        const thumbnailUrl = await thumbnailService.generateThumbnail(
          req.file.path,
          req.file.filename,
          {
            width: 300,
            height: 300,
            quality: 80,
            format: 'jpeg'
          }
        );
        
        // Add thumbnail URL to the file object
        req.file.thumbnailUrl = thumbnailUrl;
        console.log('Thumbnail generated:', thumbnailUrl);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Continue without thumbnail if generation fails
      }
    }

    next();
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    next(error);
  }
}; 