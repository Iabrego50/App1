import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '../../uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

// Ensure thumbnails directory exists
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const thumbnailService = {
  /**
   * Generate a thumbnail from an image file
   */
  generateThumbnail: async (
    sourcePath: string,
    filename: string,
    options: ThumbnailOptions = {}
  ): Promise<string> => {
    const {
      width = 300,
      height = 300,
      quality = 80,
      format = 'jpeg'
    } = options;

    // Generate thumbnail filename
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    const thumbnailFilename = `${nameWithoutExt}_thumb.${format}`;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    try {
      // Process image with sharp
      const image = sharp(sourcePath);
      
      // Resize image while maintaining aspect ratio
      const resized = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Convert to specified format and save
      switch (format) {
        case 'jpeg':
          await resized.jpeg({ quality }).toFile(thumbnailPath);
          break;
        case 'png':
          await resized.png({ quality }).toFile(thumbnailPath);
          break;
        case 'webp':
          await resized.webp({ quality }).toFile(thumbnailPath);
          break;
      }

      // Return the relative path for the thumbnail
      return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  },

  /**
   * Check if a file is an image that can be processed
   */
  isImageFile: (mimetype: string): boolean => {
    return mimetype.startsWith('image/');
  },

  /**
   * Get supported image formats
   */
  getSupportedFormats: (): string[] => {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  },

  /**
   * Delete thumbnail if it exists
   */
  deleteThumbnail: (filename: string): void => {
    const thumbnailPath = path.join(thumbnailsDir, filename);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  }
}; 