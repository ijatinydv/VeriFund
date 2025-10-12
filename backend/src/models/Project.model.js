const mongoose = require('mongoose');

/**
 * Project Schema for VeriFund
 * Stores information about fundraising projects
 */
const ProjectSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project creator is required'],
      index: true
    },

    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    category: {
      type: String,
      trim: true,
      enum: ['Technology', 'Healthcare', 'Education', 'Finance', 'E-commerce', 'Other'],
      default: 'Other'
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: ['Pending', 'Funding', 'Live', 'Completed', 'Cancelled'],
        message: 'Status must be one of: Pending, Funding, Live, Completed, Cancelled'
      },
      default: 'Pending',
      index: true
    },

    fundingGoalInr: {
      type: Number,
      required: [true, 'Funding goal is required'],
      min: [10000, 'Minimum funding goal is ₹10,000'],
      max: [100000000, 'Maximum funding goal is ₹10 crores']
    },

    currentFundingInr: {
      type: Number,
      default: 0,
      min: 0
    },

    revenueSharePercent: {
      type: Number,
      required: [true, 'Revenue share percentage is required'],
      min: [0, 'Revenue share cannot be negative'],
      max: [100, 'Revenue share cannot exceed 100%']
    },

    // Blockchain-related fields
    splitterContractAddress: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum contract address format']
    },

    nftContractAddress: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum contract address format']
    },

    // AI/ML Score
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    riskLevel: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', null],
        message: 'Risk level must be Low, Medium, High, or null'
      },
      default: null
    },

    aiAnalysis: {
      type: String,
      default: null
    },

    scoredAt: {
      type: Date,
      default: null
    },

    // Timeline fields
    fundingDeadline: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > new Date();
        },
        message: 'Funding deadline must be in the future'
      }
    },

    launchDate: {
      type: Date
    },

    // Project metadata
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://via.placeholder.com/400x300/0D47A1/FFFFFF?text=Project+Image'
    },

    websiteUrl: {
      type: String,
      trim: true
    },

    pitchDeckUrl: {
      type: String,
      trim: true
    },

    // Investor tracking
    investorCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Additional flags
    isFeatured: {
      type: Boolean,
      default: false
    },

    isVerified: {
      type: Boolean,
      default: false
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

// Compound indexes for common queries
ProjectSchema.index({ creator: 1, status: 1 });
ProjectSchema.index({ status: 1, createdAt: -1 });
ProjectSchema.index({ category: 1, status: 1 });

// Virtual field for funding progress percentage
ProjectSchema.virtual('fundingProgress').get(function() {
  if (!this.fundingGoalInr || this.fundingGoalInr === 0) return 0;
  return Math.round((this.currentFundingInr / this.fundingGoalInr) * 100);
});

// Virtual field to check if funding goal is reached
ProjectSchema.virtual('isFunded').get(function() {
  return this.currentFundingInr >= this.fundingGoalInr;
});

/**
 * Pre-save middleware for validations
 */
ProjectSchema.pre('save', function(next) {
  // Ensure current funding doesn't exceed goal
  if (this.currentFundingInr > this.fundingGoalInr) {
    this.currentFundingInr = this.fundingGoalInr;
  }
  
  // Auto-update status based on funding
  if (this.isFunded && this.status === 'Funding') {
    this.status = 'Live';
  }
  
  next();
});

/**
 * Static method to get projects by status
 */
ProjectSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('creator', 'walletAddress name');
};

/**
 * Instance method to update funding
 */
ProjectSchema.methods.addFunding = async function(amount) {
  this.currentFundingInr += amount;
  this.investorCount += 1;
  return this.save();
};

module.exports = mongoose.model('Project', ProjectSchema);
