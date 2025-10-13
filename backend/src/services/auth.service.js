const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User.model');

/**
 * Authentication Service
 * Handles wallet-based authentication using cryptographic signatures
 */
class AuthService {
  /**
   * Generate a secure nonce for wallet signature
   * @param {string} walletAddress - Ethereum wallet address
   * @param {string} role - User role (optional, only for new users)
   * @returns {Promise<Object>} - Returns nonce and expiry time
   */
  async getNonceToSign(walletAddress, role = null) {
    try {
      // Validate wallet address format
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Normalize wallet address to lowercase
      const normalizedAddress = walletAddress.toLowerCase();

      // Generate cryptographically secure random nonce
      const nonce = crypto.randomBytes(32).toString('hex');
      
      // Set nonce expiry (5 minutes from now)
      const nonceExpiry = new Date(Date.now() + 5 * 60 * 1000);

      // Find or create user
      let user = await User.findOne({ walletAddress: normalizedAddress });
      let isNewUser = false;

      if (!user) {
        // Validate role for new users
        if (role && !['Creator', 'Investor'].includes(role)) {
          throw new Error('Invalid role. Must be either Creator or Investor');
        }

        // Create new user with nonce (role will be set during login if not provided now)
        user = await User.create({
          walletAddress: normalizedAddress,
          role: role || 'Investor', // Default to Investor if no role provided
          nonce,
          nonceExpiry
        });
        isNewUser = true;
      } else {
        // Update existing user's nonce
        user.nonce = nonce;
        user.nonceExpiry = nonceExpiry;
        await user.save();
      }

      // Generate simple, static message for signing
      const message = `Please sign this one-time nonce to authenticate with VeriFund: ${nonce}`;

      return {
        nonce,
        isNewUser,
        expiresAt: nonceExpiry,
        message: message
      };

    } catch (error) {
      console.error('Error generating nonce:', error);
      throw new Error(`Failed to generate nonce: ${error.message}`);
    }
  }

  /**
   * Verify wallet signature and log in user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.walletAddress - Ethereum wallet address
   * @param {string} credentials.signature - Signed message signature
   * @param {string} credentials.role - User role (optional, only for new users)
   * @returns {Promise<Object>} - Returns JWT token and user data
   */
  async loginUser({ walletAddress, signature, role = null }) {
    try {
      // Validate inputs
      if (!walletAddress || !signature) {
        throw new Error('Wallet address and signature are required');
      }

      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Find user by wallet address - MUST explicitly select nonce fields since they have select: false
      const user = await User.findOne({ walletAddress: normalizedAddress })
        .select('+nonce +nonceExpiry'); // Explicitly include nonce fields

      if (!user) {
        throw new Error('User not found. Please request a nonce first.');
      }

      // Check if nonce exists
      if (!user.nonce) {
        throw new Error('No nonce found. Please request a nonce first.');
      }

      // Check if nonce has expired
      if (user.nonceExpiry && new Date() > user.nonceExpiry) {
        throw new Error('Nonce has expired. Please request a new nonce.');
      }

      // Reconstruct the exact same message that was signed
      const message = `Please sign this one-time nonce to authenticate with VeriFund: ${user.nonce}`;

      // Verify the signature using ethers.js
      let recoveredAddress;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature);
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        throw new Error('Invalid signature format');
      }

      // Compare recovered address with provided wallet address
      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        throw new Error('Signature verification failed. Address mismatch.');
      }

      // Update role if provided and user doesn't have one set
      if (role && ['Creator', 'Investor'].includes(role)) {
        user.role = role;
      }

      // Signature is valid - clear the nonce to prevent replay attacks
      user.nonce = null;
      user.nonceExpiry = null;
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = this._generateToken(user);

      // Return user data and token
      return {
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          email: user.email
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role (Creator or Investor)
   * @returns {Promise<Object>} - Updated user data
   */
  async updateUserRole(userId, role) {
    try {
      // Validate role
      if (!['Creator', 'Investor'].includes(role)) {
        throw new Error('Invalid role. Must be either Creator or Investor');
      }

      // Find and update user
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.role = role;
      await user.save();

      // Generate new token with updated role
      const token = this._generateToken(user);

      return {
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          email: user.email
        }
      };

    } catch (error) {
      console.error('Update role error:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  /**
   * Generate JWT token for authenticated user
   * @private
   * @param {Object} user - User document
   * @returns {string} - JWT token
   */
  _generateToken(user) {
    // Validate JWT secret exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Payload should not contain sensitive information
    const payload = {
      userId: user._id.toString(),
      walletAddress: user.walletAddress,
      role: user.role
    };

    // Token options following security best practices
    const options = {
      expiresIn: process.env.JWT_EXPIRY || '24h', // Short-lived tokens recommended
      issuer: 'verifund-api',
      audience: 'verifund-client'
    };

    // Sign and return the token
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      // Verify token with strict options
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'verifund-api',
        audience: 'verifund-client'
      });

      return decoded;

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Refresh user token
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - New token and user data
   */
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      const token = this._generateToken(user);

      return {
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name
        }
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
