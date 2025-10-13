const mongoose = require('mongoose');

/**
 * Investment Schema for VeriFund
 * Logs successful on-chain investments for investor portfolios
 */
const InvestmentSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor is required'],
      index: true
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true
    },

    amountInr: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [1000, 'Minimum investment is ₹1,000']
    },

    sharePercent: {
      type: Number,
      required: [true, 'Share percentage is required'],
      min: [0, 'Share percentage cannot be negative'],
      max: [100, 'Share percentage cannot exceed 100%']
    },

    transactionHash: {
      type: String,
      required: [true, 'Transaction hash is required'],
      trim: true,
      unique: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format']
    },

    blockNumber: {
      type: Number,
      min: 0
    },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Failed'],
      default: 'Confirmed'
    },

    // Additional metadata
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient queries
InvestmentSchema.index({ investor: 1, createdAt: -1 });
InvestmentSchema.index({ project: 1, createdAt: -1 });
InvestmentSchema.index({ transactionHash: 1 }, { unique: true });

/**
 * Static method to get investor's portfolio
 */
InvestmentSchema.statics.getInvestorPortfolio = function(investorId) {
  return this.find({ investor: investorId })
    .populate('project', 'title category status currentFundingInr fundingGoalInr')
    .sort({ createdAt: -1 });
};

/**
 * Static method to get project's investors
 */
InvestmentSchema.statics.getProjectInvestors = function(projectId) {
  return this.find({ project: projectId })
    .populate('investor', 'walletAddress name')
    .sort({ createdAt: -1 });
};

/**
 * Static method to calculate total invested by an investor
 */
InvestmentSchema.statics.getTotalInvested = async function(investorId) {
  const result = await this.aggregate([
    { $match: { investor: mongoose.Types.ObjectId(investorId), status: 'Confirmed' } },
    { $group: { _id: null, total: { $sum: '$amountInr' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('Investment', InvestmentSchema);
