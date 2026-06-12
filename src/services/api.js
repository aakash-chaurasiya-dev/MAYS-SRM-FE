import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred.';
    let severity = 'error';
    let status = null;

    if (error.response) {
      status = error.response.status;
      if (status === 401) {
        message = 'Session expired. Please log in again.';
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
      } else if (status === 403) {
        message = 'You are not allowed to access this page.';
      } else if (status === 400) {
        message = error.response.data?.message || 'Bad Request. Please check your input.';
        severity = 'warning';
      } else if (status === 404) {
        message = 'The requested resource was not found.';
        severity = 'warning';
      }else if (status === 409) {
        message = 'The requested resource already exists.';
        severity = 'warning';
      } else if (status >= 500) {
        message = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      message = 'Network error. Please check your connection.';
    }

    // Dispatch custom dynamic error event
    window.dispatchEvent(new CustomEvent('api-error', { 
      detail: { message, severity, status } 
    }));

    return Promise.reject(error);
  }
);

export default api;
