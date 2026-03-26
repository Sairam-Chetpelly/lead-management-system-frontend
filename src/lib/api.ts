import axios from 'axios';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 500000, // 500 seconds
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || 'lms-secure-api-key-2024',
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_CONFIG.API_KEY,
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and check for inactive user or expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    
    // Only redirect on 401 if we're not already on login page and it's not a login attempt
    if (status === 401 && currentPath !== '/' && currentPath !== '/login' && !error.config?.url?.includes('/auth/login')) {
      // Token expired, force logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('currentPage');
      localStorage.removeItem('lastVisitedPage');
      window.location.href = '';
    } else if (status === 403 && error.response?.data?.error?.includes('inactive')) {
      // User is inactive, force logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('currentPage');
      localStorage.removeItem('lastVisitedPage');
      window.location.href = '';
    } else if ([500, 502, 503, 504].includes(status)) {
      // Server errors - store error info for error page
      localStorage.setItem('lastError', JSON.stringify({
        status,
        message: error.response?.data?.message || error.message,
        timestamp: Date.now()
      }));
    }
    
    return Promise.reject(error);
  }
);

export default api;