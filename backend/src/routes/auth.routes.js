const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Authentication Routes
 * All routes are prefixed with /api/auth
 */

/**
 * @route   GET /api/auth/nonce/:walletAddress
 * @desc    Get a nonce for wallet signature authentication
 * @access  Public
 */
router.get('/nonce/:walletAddress', authController.getNonce);

/**
 * @route   POST /api/auth/login
 * @desc    Verify signature and authenticate user
 * @access  Public
 * @body    { walletAddress: string, signature: string }
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Protected
 */
router.get('/verify', authenticate, authController.verifyToken);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Protected
 */
router.post('/refresh', authenticate, authController.refreshToken);

/**
 * @route   PUT /api/auth/role
 * @desc    Update user role
 * @access  Protected
 * @body    { role: string }
 */
router.put('/role', authenticate, authController.updateRole);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
