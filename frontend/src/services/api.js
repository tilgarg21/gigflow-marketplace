import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  getMe: () => api.get(API_ENDPOINTS.AUTH.ME)
};

// Gigs API
export const gigsAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.GIGS.BASE, { params }),
  getById: (id) => api.get(`${API_ENDPOINTS.GIGS.BASE}/${id}`),
  create: (gigData) => api.post(API_ENDPOINTS.GIGS.BASE, gigData),
  update: (id, gigData) => api.put(`${API_ENDPOINTS.GIGS.BASE}/${id}`, gigData),
  delete: (id) => api.delete(`${API_ENDPOINTS.GIGS.BASE}/${id}`),
  getMyPosted: () => api.get(API_ENDPOINTS.GIGS.MY_POSTED)
};

// Bids API
export const bidsAPI = {
  create: (bidData) => api.post(API_ENDPOINTS.BIDS.BASE, bidData),
  getMySubmitted: () => api.get(API_ENDPOINTS.BIDS.MY_SUBMITTED),
  getByGig: (gigId) => api.get(`${API_ENDPOINTS.BIDS.BASE}/gig/${gigId}`),
  hire: (bidId) => api.put(API_ENDPOINTS.BIDS.HIRE(bidId))
};

export default api;