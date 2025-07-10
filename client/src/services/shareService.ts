import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://app1-production-1a24.up.railway.app/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ShareRequest {
  email: string;
  message?: string;
}

export interface ShareResponse {
  message: string;
  sharedWith: string;
  projectTitle: string;
}

export const shareService = {
  // Share a project via email
  shareProject: async (projectId: number, shareData: ShareRequest): Promise<ShareResponse> => {
    try {
      const response = await api.post(`/projects/${projectId}/share`, shareData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to share project');
    }
  },

  // Share project via email (alternative method using mailto)
  shareViaEmail: (projectTitle: string, projectUrl: string, message?: string) => {
    const subject = encodeURIComponent(`Check out this research project: ${projectTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share this research project with you:\n\n${projectTitle}\n\n${projectUrl}\n\n${message || ''}\n\nBest regards`
    );
    
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  }
}; 