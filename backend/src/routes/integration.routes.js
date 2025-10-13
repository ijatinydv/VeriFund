const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Integration Routes
 * All routes are prefixed with /api/integrations
 */

// ============ AI Scoring Routes ============

/**
 * @route   POST /api/integrations/projects/:id/score
 * @desc    Start AI scoring job for a project
 * @access  Protected - Creator only
 */
router.post(
  '/projects/:id/score',
  authenticate,
  authorize('Creator'),
  integrationController.startProjectScoring
);

/**
 * @route   GET /api/integrations/jobs/:jobId/status
 * @desc    Get scoring job status
 * @access  Public
 */
router.get('/jobs/:jobId/status', integrationController.getJobStatus);

// ============ Webhook Routes ============

/**
 * @route   POST /api/integrations/webhooks/github
 * @desc    Handle GitHub webhook for live re-scoring
 * @access  Public - GitHub webhook endpoint
 */
router.post('/webhooks/github', integrationController.handleGithubWebhook);

/**
 * @route   POST /api/integrations/update-score
 * @desc    Update project potential score (called by AI service)
 * @access  Public - AI service endpoint
 */
router.post('/update-score', integrationController.handleScoreUpdate);

// ============ Blockchain Routes ============

/**
 * @route   POST /api/integrations/consent/log
 * @desc    Log user consent on blockchain
 * @access  Protected
 */
router.post(
  '/consent/log',
  authenticate,
  integrationController.logConsent
);

/**
 * @route   POST /api/integrations/tokens/mint
 * @desc    Mint security token (NFT) for investor
 * @access  Protected - Admin/Creator only
 */
router.post(
  '/tokens/mint',
  authenticate,
  authorize('Creator'),
  integrationController.mintSecurityToken
);

/**
 * @route   POST /api/integrations/splitter/deploy
 * @desc    Deploy revenue splitter contract
 * @access  Protected - Creator only
 */
router.post(
  '/splitter/deploy',
  authenticate,
  authorize('Creator'),
  integrationController.deploySplitter
);

/**
 * @route   GET /api/integrations/transactions/:txHash
 * @desc    Get blockchain transaction details
 * @access  Public
 */
router.get('/transactions/:txHash', integrationController.getTransaction);

// ============ Health Check Routes ============

/**
 * @route   GET /api/integrations/health
 * @desc    Check health of integration services
 * @access  Public
 */
router.get('/health', integrationController.checkHealth);

module.exports = router;
