const mongoose = require('mongoose');

/**
 * User Schema for VeriFund
 * Stores information about Creators and Investors
 */
const UserSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Index for faster queries
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address format']
    },
    
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['Creator', 'Investor'],
        message: 'Role must be either Creator or Investor'
      }
    },
    
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows multiple null values while maintaining uniqueness for non-null values
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },

    isActive: {
      type: Boolean,
      default: true
    },
    nonce: {
  type: String,
  default: null,
  select: false // Don't include in queries by default for security
},

nonceExpiry: {
  type: Date,
  default: null,
  select: false
},

lastLogin: {
  type: Date
}
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v; // Remove version key from JSON output
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
UserSchema.index({ role: 1, isActive: 1 });

// Virtual field for project count (can be populated later)
UserSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'creator',
  count: true
});

/**
 * Pre-save hook to perform validations
 */
UserSchema.pre('save', function(next) {
  // Additional custom validations can be added here
  next();
});

module.exports = mongoose.model('User', UserSchema);
