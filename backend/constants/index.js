// Gig status constants
const GIG_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Bid status constants
const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

// User roles
const USER_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer'
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  HIRE_NOT_ELIGIBLE: 'HIRE_NOT_ELIGIBLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Rate limiting
const RATE_LIMITS = {
  HIRE_ATTEMPTS_PER_MINUTE: 5,
  HIRE_WINDOW_MINUTES: 1
};

module.exports = {
  GIG_STATUS,
  BID_STATUS,
  USER_ROLES,
  ERROR_CODES,
  RATE_LIMITS
};