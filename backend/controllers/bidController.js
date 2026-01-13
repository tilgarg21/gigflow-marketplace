const Bid = require('../models/Bid');
const Gig = require('../models/Gig');
const { 
  hireBidWithTransaction, 
  validateHireEligibility 
} = require('../services/hireBidService');

// @desc    Submit a bid
// @route   POST /api/bids
// @access  Private (Freelancer only)
const submitBid = async (req, res) => {
  try {
    const { gigId, proposal, bidAmount, deliveryTime } = req.body;

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This gig is no longer accepting bids'
      });
    }

    // Check if freelancer already bid on this gig
    const existingBid = await Bid.findOne({
      gig: gigId,
      freelancer: req.user.id
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a bid for this gig'
      });
    }

    // Validate bid amount is within gig budget range
    if (!gig.budget || typeof gig.budget.min !== 'number' || typeof gig.budget.max !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Gig budget information is incomplete'
      });
    }

    if (bidAmount < gig.budget.min || bidAmount > gig.budget.max) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be between $${gig.budget.min} and $${gig.budget.max}`
      });
    }

    const bid = await Bid.create({
      gig: gigId,
      freelancer: req.user.id,
      proposal,
      bidAmount,
      deliveryTime
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancer', 'name email profile')
      .populate('gig', 'title');

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      bid: populatedBid
    });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting bid'
    });
  }
};

// @desc    Hire a freelancer (Accept a bid with transaction safety)
// @route   PUT /api/bids/:bidId/hire
// @access  Private (Client only)
const hireBid = async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const clientId = req.user.id;

    // Step 1: Pre-validation to provide quick feedback
    const validation = await validateHireEligibility(bidId, clientId);
    if (!validation.eligible) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        code: 'HIRE_NOT_ELIGIBLE'
      });
    }

    // Step 2: Execute secure hire with transaction
    const result = await hireBidWithTransaction(bidId, clientId);

    // Step 3: Return success response
    res.json({
      success: true,
      message: result.message,
      data: {
        bid: result.data.bid,
        gig: {
          id: result.data.gig._id,
          title: result.data.gig.title,
          status: result.data.gig.status,
          hiredAt: result.data.gig.hiredAt
        },
        freelancer: result.data.bid.freelancer,
        rejectedBidsCount: result.data.rejectedBidsCount,
        hireDetails: {
          bidAmount: result.data.hireRecord.bidAmount,
          deliveryTime: result.data.hireRecord.deliveryTime,
          hiredAt: result.data.hireRecord.hiredAt
        }
      }
    });

  } catch (error) {
    console.error('Hire bid error:', error);
    
    // Handle specific error types
    if (error.message.includes('race condition') || 
        error.message.includes('already been hired') ||
        error.message.includes('Concurrent modification')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'HIRE_CONFLICT'
      });
    }

    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'HIRE_UNAUTHORIZED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during hire process',
      code: 'HIRE_SERVER_ERROR'
    });
  }
};

// @desc    Get bids for a specific gig
// @route   GET /api/bids/gig/:gigId
// @access  Private (Client only - own gigs)
const getBidsForGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Check if user owns the gig
    if (gig.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bids for this gig'
      });
    }

    const bids = await Bid.find({ gig: req.params.gigId })
      .populate('freelancer', 'name email profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    console.error('Get bids for gig error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bids'
    });
  }
};

// @desc    Get freelancer's submitted bids
// @route   GET /api/bids/my/submitted
// @access  Private (Freelancer only)
const getMySubmittedBids = async (req, res) => {
  try {
    const bids = await Bid.find({ freelancer: req.user.id })
      .populate('gig', 'title status client')
      .populate({
        path: 'gig',
        populate: { path: 'client', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    console.error('Get my submitted bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your bids'
    });
  }
};

module.exports = {
  submitBid,
  getBidsForGig,
  getMySubmittedBids,
  hireBid
};