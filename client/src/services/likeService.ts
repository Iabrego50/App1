const API_BASE_URL = '/api';

export interface Like {
  id: number;
  created_at: string;
  author: string;
}

export const likeService = {
  // Get all likes for a project
  async getLikes(projectId: number): Promise<Like[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/likes/project/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch likes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching likes:', error);
      throw error;
    }
  },

  // Toggle like for a project
  async toggleLike(projectId: number): Promise<{ liked: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectId })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Check if current user has liked a project
  async checkLikeStatus(projectId: number): Promise<{ liked: boolean }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/likes/check/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check like status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking like status:', error);
      throw error;
    }
  }
}; 