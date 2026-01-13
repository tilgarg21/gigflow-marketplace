const express = require('express');
const {
  getGigs,
  getGig,
  createGig,
  getMyPostedGigs,
  updateGig,
  deleteGig
} = require('../controllers/gigController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/gigs
router.get('/', getGigs);

// @route   GET /api/gigs/my/posted
router.get('/my/posted', auth, authorize('client'), getMyPostedGigs);

// @route   GET /api/gigs/:id
router.get('/:id', getGig);

// @route   POST /api/gigs
router.post('/', auth, authorize('client'), createGig);

// @route   PUT /api/gigs/:id
router.put('/:id', auth, authorize('client'), updateGig);

// @route   DELETE /api/gigs/:id
router.delete('/:id', auth, authorize('client'), deleteGig);

module.exports = router;