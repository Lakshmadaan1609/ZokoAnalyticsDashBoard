import axios from 'axios';

const PRODUCTION_API_URL = 'https://posbackendfastapi.vercel.app';

// Use env in build/runtime; fallback to production backend when deployed without env (e.g. Vercel)
const getBaseURL = (): string => {
  if (typeof process.env.NEXT_PUBLIC_API_URL === 'string' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname !== 'localhost' && window.location?.hostname !== '127.0.0.1') {
    return PRODUCTION_API_URL;
  }
  if (typeof process !== 'undefined' && process.env.VERCEL) {
    return PRODUCTION_API_URL;
  }
  return 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status !== 404) {
        const message = error.response.data?.detail || 'An error occurred';
        console.error('API Error:', message);
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
