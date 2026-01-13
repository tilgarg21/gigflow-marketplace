// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  GIGS: {
    BASE: '/api/gigs',
    MY_POSTED: '/api/gigs/my/posted'
  },
  BIDS: {
    BASE: '/api/bids',
    MY_SUBMITTED: '/api/bids/my/submitted',
    HIRE: (bidId) => `/api/bids/${bidId}/hire`
  }
};

// Gig categories
export const GIG_CATEGORIES = [
  { value: 'web-development', label: 'Web Development', icon: '' },
  { value: 'mobile-development', label: 'Mobile Development', icon: '' },
  { value: 'design', label: 'Design', icon: '' },
  { value: 'writing', label: 'Writing', icon: '' },
  { value: 'marketing', label: 'Marketing', icon: '' },
  { value: 'other', label: 'Other', icon: '' }
];

// Status constants
export const GIG_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};