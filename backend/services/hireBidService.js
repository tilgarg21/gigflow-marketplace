const mongoose = require('mongoose');
const User = require('../models/User');
const Gig = require('../models/Gig');
const Bid = require('../models/Bid');
const { GIG_STATUS, BID_STATUS, ERROR_CODES } = require('../constants');

/**
 * Hire a freelancer with atomic transaction to prevent race conditions
 * Uses MongoDB transactions with ACID compliance for data consistency
 * 
 * @param {string} bidId - The bid ID to accept/hire
 * @param {string} clientId - The client ID making the hire decision
 * @returns {Object} - Result object with success status and data
 */
const hireBidWithTransaction = async (bidId, clientId) => {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      // Step 1: Find and validate the bid with session lock
      const bid = await Bid.findById(bidId)
        .populate('gig')
        .populate('freelancer', 'name email profile')
        .session(session);

      if (!bid) {
        throw new Error('Bid not found');
      }

      // Step 2: Validate gig ownership and status with pessimistic locking
      const gig = await Gig.findById(bid.gig._id).session(session);
      
      if (!gig) {
        throw new Error('Gig not found');
      }

      if (gig.client.toString() !== clientId) {
        throw new Error('Not authorized to hire for this gig');
      }

      // Step 3: Check if gig is still open (critical race condition check)
      if (gig.status !== GIG_STATUS.OPEN) {
        throw new Error(`Cannot hire for this gig. Current status: ${gig.status}`);
      }

      // Step 4: Check if bid is still pending
      if (bid.status !== BID_STATUS.PENDING) {
        throw new Error(`This bid has already been processed. Current status: ${bid.status}`);
      }

      // Step 5: Double-check no other bid has been accepted (additional safety)
      const existingAcceptedBid = await Bid.findOne({
        gig: gig._id,
        status: BID_STATUS.ACCEPTED
      }).session(session);

      if (existingAcceptedBid) {
        throw new Error('Another freelancer has already been hired for this gig');
      }

      // Step 6: Atomic updates - Accept the bid
      const updatedBid = await Bid.findByIdAndUpdate(
        bidId,
        { 
          status: BID_STATUS.ACCEPTED,
          acceptedAt: new Date()
        },
        { 
          new: true, 
          session,
          runValidators: true 
        }
      ).populate('freelancer', 'name email profile')
       .populate('gig', 'title');

      // Step 7: Update gig status and set selected bid
      const updatedGig = await Gig.findByIdAndUpdate(
        gig._id,
        {
          status: GIG_STATUS.IN_PROGRESS,
          selectedBid: bidId,
          hiredAt: new Date()
        },
        { 
          new: true, 
          session,
          runValidators: true 
        }
      );

      // Step 8: Reject all other pending bids for this gig
      const rejectedBidsResult = await Bid.updateMany(
        {
          gig: gig._id,
          _id: { $ne: bidId },
          status: BID_STATUS.PENDING
        },
        {
          status: BID_STATUS.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: 'Another freelancer was selected'
        },
        { session }
      );

      // Return transaction result
      return {
        success: true,
        message: 'Freelancer hired successfully',
        data: {
          bid: updatedBid,
          gig: updatedGig,
          rejectedBidsCount: rejectedBidsResult.modifiedCount
        }
      };

    }, {
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true }
    });

    return result;

  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Duplicate hire attempt detected');
    }
    
    if (error.name === 'VersionError') {
      throw new Error('Concurrent modification detected. Please try again.');
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Validate hire eligibility before attempting hire
 * @param {string} bidId - The bid ID to validate
 * @param {string} clientId - The client ID
 * @returns {Object} - Validation result
 */
const validateHireEligibility = async (bidId, clientId) => {
  try {
    const bid = await Bid.findById(bidId)
      .populate('gig')
      .populate('freelancer', 'name email');

    if (!bid) {
      return { eligible: false, reason: 'Bid not found' };
    }

    if (bid.gig.client.toString() !== clientId) {
      return { eligible: false, reason: 'Not authorized to hire for this gig' };
    }

    if (bid.gig.status !== GIG_STATUS.OPEN) {
      return { eligible: false, reason: `Gig is ${bid.gig.status}, not accepting hires` };
    }

    if (bid.status !== BID_STATUS.PENDING) {
      return { eligible: false, reason: `Bid is ${bid.status}, cannot be hired` };
    }

    // Check if another bid is already accepted
    const acceptedBid = await Bid.findOne({
      gig: bid.gig._id,
      status: BID_STATUS.ACCEPTED
    });

    if (acceptedBid) {
      return { eligible: false, reason: 'Another freelancer has already been hired' };
    }

    return {
      eligible: true,
      bid: {
        id: bid._id,
        freelancer: bid.freelancer,
        bidAmount: bid.bidAmount,
        deliveryTime: bid.deliveryTime,
        proposal: bid.proposal
      },
      gig: {
        id: bid.gig._id,
        title: bid.gig.title,
        status: bid.gig.status
      }
    };
  } catch (error) {
    return { eligible: false, reason: `Validation error: ${error.message}` };
  }
};

module.exports = {
  hireBidWithTransaction,
  validateHireEligibility
};