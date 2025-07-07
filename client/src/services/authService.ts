import axios from 'axios';

const API_BASE = '/api/auth';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export const authService = {
  // Login user
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${API_BASE}/login`, { email, password });
    const data = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    
    return data;
  },

  // Register user
  register: async (username: string, email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${API_BASE}/register`, { username, email, password });
    const data = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    
    return data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Initialize auth (call this on app startup)
  initAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}; 