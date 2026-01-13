const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  deadline: {
    type: Date,
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  hiredAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Index for better query performance
gigSchema.index({ status: 1, createdAt: -1 });
gigSchema.index({ client: 1 });

module.exports = mongoose.model('Gig', gigSchema);