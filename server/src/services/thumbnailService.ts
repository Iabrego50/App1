import path from 'path';
import fs from 'fs';

// Use process.cwd() to get the project root directory
const uploadsDir = path.join(process.cwd(), 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

console.log('Current working directory:', process.cwd());
console.log('Uploads directory:', uploadsDir);
console.log('Thumbnails directory:', thumbnailsDir);

// Ensure thumbnails directory exists
if (!fs.existsSync(thumbnailsDir)) {
  console.log('Creating thumbnails directory:', thumbnailsDir);
  fs.mkdirSync(thumbnailsDir, { recursive: true });
} else {
  console.log('Thumbnails directory already exists:', thumbnailsDir);
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
  generateThumbnail: (
    sourcePath: string,
    filename: string,
    options: ThumbnailOptions = {}
  ): string | null => {
    console.log('Starting thumbnail generation for:', filename);
    console.log('Source path:', sourcePath);
    
    const {
      width = 300,
      height = 300,
      quality = 80,
      format = 'jpeg'
    } = options;

    // Generate thumbnail filename - preserve original format
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    // Use the original file extension instead of forcing jpeg
    const thumbnailFilename = `${nameWithoutExt}_thumb${ext}`;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    console.log('Thumbnail path:', thumbnailPath);
    console.log('Thumbnails directory exists:', fs.existsSync(thumbnailsDir));

    try {
      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        console.error('Source file does not exist:', sourcePath);
        return null;
      }
      
      // For PDFs and images, copy the original file as a "thumbnail"
      // This is a fallback when Sharp is not working properly
      // For PDFs, we use the PDF itself as the thumbnail
      fs.copyFileSync(sourcePath, thumbnailPath);
      
      console.log('Thumbnail created (copy):', thumbnailPath);
      console.log('Thumbnail file exists after creation:', fs.existsSync(thumbnailPath));
      
      // Return the relative path for the thumbnail
      const relativePath = `/uploads/thumbnails/${thumbnailFilename}`;
      console.log('Returning thumbnail URL:', relativePath);
      return relativePath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return null instead of throwing error to prevent upload failure
      return null;
    }
  },

  /**
   * Check if a file is an image that can be processed
   */
  isImageFile: (mimetype: string): boolean => {
    return mimetype.startsWith('image/');
  },

  /**
   * Check if a file can have a thumbnail generated (only images now, PDFs use generic frontend thumbnail)
   */
  canGenerateThumbnail: (mimetype: string): boolean => {
    return mimetype.startsWith('image/');
  },

  /**
   * Get supported image formats for thumbnail generation
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