const mongoose = require('mongoose');

/**
 * Investment Schema for VeriFund
 * Tracks investor contributions to projects
 */
const InvestmentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true
    },

    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor reference is required'],
      index: true
    },

    investorAddress: {
      type: String,
      required: [true, 'Investor wallet address is required'],
      lowercase: true,
      trim: true,
      index: true
    },

    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [0, 'Investment amount must be positive']
    },

    currency: {
      type: String,
      default: 'ETH',
      enum: ['ETH', 'USDC', 'USDT']
    },

    transactionHash: {
      type: String,
      required: [true, 'Transaction hash is required'],
      unique: true,
      index: true
    },

    blockNumber: {
      type: Number
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    },

    tokensReceived: {
      type: Number,
      default: 0
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
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

// Compound index for investor's investments
InvestmentSchema.index({ investor: 1, createdAt: -1 });

// Compound index for project's investments
InvestmentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Investment', InvestmentSchema);
