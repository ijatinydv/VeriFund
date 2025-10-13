const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const payoutController = require('../controllers/payout.controller');

/**
 * Payout Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/payout/upi-qr/:projectId
 * @desc    Generate UPI QR code data for project payout
 * @access  Private (Creator only)
 */
router.get('/upi-qr/:projectId', authenticate, payoutController.generateUpiQrCode);

/**
 * @route   GET /api/payout/summary/:projectId
 * @desc    Get payout summary for a project
 * @access  Private (Creator only)
 */
router.get('/summary/:projectId', authenticate, payoutController.getPayoutSummary);

module.exports = router;
