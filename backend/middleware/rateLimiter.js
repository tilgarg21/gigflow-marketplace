const rateLimit = require('express-rate-limit');

// Rate limiter for hire requests - prevents rapid-fire hire attempts
const hireRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Maximum 5 hire attempts per minute per IP
  message: {
    success: false,
    message: 'Too many hire attempts. Please wait before trying again.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user ID for more precise limiting
  keyGenerator: (req) => {
    return `hire_${req.ip}_${req.user?.id || 'anonymous'}`;
  },
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: true,
  // Skip failed requests that are client errors (4xx) but count server errors (5xx)
  skipFailedRequests: false
});

// Rate limiter for bid submissions
const bidSubmissionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 bid submissions per 15 minutes
  message: {
    success: false,
    message: 'Too many bid submissions. Please wait before submitting more bids.',
    code: 'BID_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => {
    return `bid_${req.ip}_${req.user?.id || 'anonymous'}`;
  }
});

// General API rate limiter
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  hireRateLimit,
  bidSubmissionRateLimit,
  generalRateLimit
};