import axios from 'axios';
import { Project } from '../types/Project';

const API_BASE = '/api/projects';

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await axios.get(API_BASE);
    return response.data;
  },

  // Get single project
  getById: async (id: number): Promise<Project> => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new project
  create: async (projectData: { title: string; description: string; thumbnail?: string }): Promise<Project> => {
    const response = await axios.post(API_BASE, projectData);
    return response.data;
  },

  // Update project
  update: async (id: number, projectData: Partial<Project>): Promise<Project> => {
    const response = await axios.put(`${API_BASE}/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}`);
  },

  // Get project media
  getMedia: async (projectId: number): Promise<any[]> => {
    const response = await axios.get(`${API_BASE}/${projectId}`);
    return response.data.media || [];
  },

  // Add media to project
  addMedia: async (projectId: number, mediaData: { 
    type: 'video' | 'image' | 'doc'; 
    url: string; 
    filename: string; 
    thumbnailUrl?: string;
    originalname?: string; 
    mimetype?: string; 
  }) => {
    try {
      console.log('Adding media to project:', { projectId, mediaData });
      const response = await axios.post(`${API_BASE}/${projectId}/media`, mediaData);
      console.log('Media added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Add media error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add media to project';
      throw new Error(errorMessage);
    }
  },

  // Delete media from project
  deleteMedia: async (projectId: number, mediaId: number): Promise<void> => {
    try {
      console.log('Deleting media from project:', { projectId, mediaId });
      await axios.delete(`${API_BASE}/${projectId}/media/${mediaId}`);
      console.log('Media deleted successfully');
    } catch (error: any) {
      console.error('Delete media error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete media from project';
      throw new Error(errorMessage);
    }
  }
}; 