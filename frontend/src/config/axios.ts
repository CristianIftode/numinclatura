import axios from 'axios';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:3001';

// Configure axios to include auth token in all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios; 