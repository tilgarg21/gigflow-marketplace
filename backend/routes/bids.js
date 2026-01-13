const express = require('express');
const {
  submitBid,
  getBidsForGig,
  getMySubmittedBids,
  hireBid
} = require('../controllers/bidController');
const { auth, authorize } = require('../middleware/auth');
const { hireRateLimit, bidSubmissionRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/bids
router.post('/', auth, authorize('freelancer'), bidSubmissionRateLimit, submitBid);

// @route   GET /api/bids/gig/:gigId
router.get('/gig/:gigId', auth, authorize('client'), getBidsForGig);

// @route   GET /api/bids/my/submitted
router.get('/my/submitted', auth, authorize('freelancer'), getMySubmittedBids);

// @route   PUT /api/bids/:bidId/hire (Secure hire with race condition protection)
router.put('/:bidId/hire', auth, authorize('client'), hireRateLimit, hireBid);

module.exports = router;