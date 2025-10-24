const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

/**
 * User Profile Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile (name, upiId)
 * @access  Private
 */
router.put('/profile', authenticate, userController.updateUserProfile);

module.exports = router;
