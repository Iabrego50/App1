import axios from 'axios';

const API_BASE = '/api/upload';

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  type: 'video' | 'image' | 'doc';
  thumbnailUrl?: string;
}

export const uploadService = {
  // Upload single file
  uploadFile: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.file;
    } catch (error: any) {
      console.error('Upload file error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
      throw new Error(errorMessage);
    }
  },

  // Upload multiple files
  uploadFiles: async (files: File[]): Promise<UploadedFile[]> => {
    console.log('=== UPLOAD SERVICE START ===');
    console.log('Files to upload:', files.length);
    console.log('API endpoint:', `${API_BASE}/files`);
    console.log('Authorization header:', axios.defaults.headers.common['Authorization']);
    
    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`Adding file ${index}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      formData.append('files', file);
    });

    console.log('FormData created, making request...');
    try {
      const response = await axios.post(`${API_BASE}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response received:', response.data);
      return response.data.files;
    } catch (error: any) {
      console.error('=== UPLOAD SERVICE ERROR ===');
      console.error('Upload files error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload files';
      throw new Error(errorMessage);
    }
  },

  // Add uploaded file to project
  addFileToProject: async (projectId: number, file: UploadedFile) => {
    try {
      const response = await axios.post(`${API_BASE}/project/${projectId}/media`, {
        filename: file.filename,
        originalname: file.originalname,
        type: file.type,
        url: file.url
      });

      return response.data;
    } catch (error: any) {
      console.error('Add file to project error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add file to project';
      throw new Error(errorMessage);
    }
  },

  // Delete uploaded file
  deleteFile: async (filename: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE}/file/${filename}`);
    } catch (error: any) {
      console.error('Delete file error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete file';
      throw new Error(errorMessage);
    }
  }
}; 