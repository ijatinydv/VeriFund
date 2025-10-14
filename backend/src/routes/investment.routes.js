const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Investment Routes
 * All routes are prefixed with /api/investments
 */

/**
 * @route   POST /api/investments
 * @desc    Create a new investment (triggers auto splitter deployment if goal met)
 * @access  Protected - Investor only
 */
router.post('/', authenticate, investmentController.createInvestment);

/**
 * @route   POST /api/investments/:projectId
 * @desc    Create a new investment with projectId in URL (simplified INR-based flow)
 * @access  Protected - Investor only
 */
router.post('/:projectId', authenticate, investmentController.createInvestmentByProjectId);

/**
 * @route   GET /api/investments/my
 * @desc    Get current user's investments
 * @access  Protected
 */
router.get('/my', authenticate, investmentController.getMyInvestments);

/**
 * @route   GET /api/investments/stats
 * @desc    Get investment statistics for current user
 * @access  Protected
 */
router.get('/stats', authenticate, investmentController.getInvestmentStats);

/**
 * @route   GET /api/investments/project/:projectId
 * @desc    Get all investments for a specific project
 * @access  Public
 */
router.get('/project/:projectId', investmentController.getProjectInvestments);

/**
 * @route   POST /api/investments/deploy-splitter/:projectId
 * @desc    Manually deploy splitter contract for a project (Admin/Debug)
 * @access  Protected - Creator only
 */
router.post(
  '/deploy-splitter/:projectId',
  authenticate,
  authorize('Creator'),
  investmentController.deploySplitter
);

module.exports = router;
