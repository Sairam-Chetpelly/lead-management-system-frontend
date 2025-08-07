import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userAPI = {
  getUsers: () => api.get('/api/users'),
  createUser: (userData: { name: string; email: string }) => 
    api.post('/api/users', userData),
};

export default api;