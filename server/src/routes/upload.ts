import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadWithThumbnails, processUploadedFile, getFileUrl } from '../middleware/upload';
import { db } from '../database/init';
import path from 'path';
import fs from 'fs';

const router = Router();

// Upload single file with thumbnail generation
router.post('/file', authenticateToken, uploadWithThumbnails, processUploadedFile, (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine file type based on mimetype
    let type = 'doc';
    if (req.file.mimetype.startsWith('image/')) {
      type = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      type = 'video';
    }

    const fileUrl = getFileUrl(req.file.filename, type);

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        type: type,
        thumbnailUrl: req.file.thumbnailUrl || null
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Upload multiple files with thumbnail generation
router.post('/files', authenticateToken, (req: any, res: Response) => {
  const uploadMultiple = upload.array('files', 10); // Allow up to 10 files

  uploadMultiple(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      const uploadedFiles = [];

      for (const file of req.files) {
        // Generate thumbnail for image files
        let thumbnailUrl = null;
        if (file.mimetype.startsWith('image/')) {
          try {
            const { thumbnailService } = await import('../services/thumbnailService');
            thumbnailUrl = await thumbnailService.generateThumbnail(
              file.path,
              file.filename,
              {
                width: 300,
                height: 300,
                quality: 80,
                format: 'jpeg'
              }
            );
          } catch (error) {
            console.error('Failed to generate thumbnail for', file.filename, error);
          }
        }

        // Determine file type
        let type = 'doc';
        if (file.mimetype.startsWith('image/')) {
          type = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          type = 'video';
        }

        const fileUrl = getFileUrl(file.filename, type);

        uploadedFiles.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl,
          type: type,
          thumbnailUrl: thumbnailUrl
        });
      }

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Error uploading files' });
    }
  });
});

// Delete uploaded file
router.delete('/file/:filename', authenticateToken, (req: any, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Also delete thumbnail if it exists
      try {
        const { thumbnailService } = require('../services/thumbnailService');
        thumbnailService.deleteThumbnail(filename);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
      
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Error handling middleware for multer errors
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
  }
  if (error.name === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: 'File type not allowed.' });
  }
  if (error) {
    console.error('Upload middleware error:', error);
    return res.status(500).json({ message: 'Error processing upload' });
  }
  next();
});

// Add uploaded file to project
router.post('/project/:projectId/media', authenticateToken, (req: any, res: Response) => {
  const projectId = req.params.projectId;
  const { filename, originalname, type, url } = req.body;

  if (!filename || !originalname || !type || !url) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.run('INSERT INTO project_media (project_id, type, url, filename) VALUES (?, ?, ?, ?)', 
    [projectId, type, url, originalname], function(this: any, err: any) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error adding media to project' });
    }

    db.get('SELECT * FROM project_media WHERE id = ?', [this.lastID], (err: any, media: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error retrieving media' });
      }
      res.status(201).json(media);
    });
  });
});

export { router as uploadRoutes }; 