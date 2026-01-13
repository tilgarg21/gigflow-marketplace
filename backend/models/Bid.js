const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: String,
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, { 
  timestamps: true 
});

// Compound index to prevent duplicate bids from same freelancer on same gig
bidSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

// Index for better query performance
bidSchema.index({ gig: 1, status: 1 });
bidSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);