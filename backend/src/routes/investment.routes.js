const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Investment Routes
 * All routes require authentication
 */

// Create a new investment
router.post('/', authenticate, investmentController.createInvestment);

// Get current user's investments
router.get('/my', authenticate, investmentController.getMyInvestments);

// Get investment statistics for current user
router.get('/stats/summary', authenticate, investmentController.getInvestmentStats);

// Get all investments for a specific project
router.get('/project/:projectId', investmentController.getProjectInvestments);

// Get a specific investment by ID
router.get('/:id', authenticate, investmentController.getInvestmentById);

module.exports = router;
