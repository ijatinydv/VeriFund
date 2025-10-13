const investmentService = require('../services/investment.service');

/**
 * Investment Controllers
 * Handle HTTP requests for investment endpoints
 */
class InvestmentController {
  /**
   * POST /api/investments
   * Record a new investment transaction
   * @protected - Investor only
   */
  async createInvestment(req, res) {
    try {
      const { projectId, amount, transactionHash } = req.body;
      const investorId = req.user.userId;

      // Validate required fields
      if (!projectId || !amount || !transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'projectId, amount, and transactionHash are required'
        });
      }

      // Call investment service
      const result = await investmentService.createInvestment({
        projectId,
        investorId,
        amount,
        transactionHash
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Create investment error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to record investment'
      });
    }
  }

  /**
   * GET /api/investments/my
   * Get current user's investments
   * @protected
   */
  async getMyInvestments(req, res) {
    try {
      const investorId = req.user.userId;

      const investments = await investmentService.getInvestorInvestments(investorId);

      return res.status(200).json({
        success: true,
        data: {
          investments,
          total: investments.length
        }
      });

    } catch (error) {
      console.error('Get my investments error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch investments'
      });
    }
  }

  /**
   * GET /api/investments/project/:projectId
   * Get all investments for a specific project
   * @public
   */
  async getProjectInvestments(req, res) {
    try {
      const { projectId } = req.params;

      const investments = await investmentService.getProjectInvestments(projectId);

      // Calculate total investment
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInr, 0);

      return res.status(200).json({
        success: true,
        data: {
          investments,
          total: investments.length,
          totalInvested
        }
      });

    } catch (error) {
      console.error('Get project investments error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch project investments'
      });
    }
  }

  /**
   * GET /api/investments/stats
   * Get investment statistics for the current user
   * @protected
   */
  async getInvestmentStats(req, res) {
    try {
      const investorId = req.user.userId;

      const stats = await investmentService.getInvestorStats(investorId);

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get investment stats error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch investment statistics'
      });
    }
  }

  /**
   * POST /api/investments/deploy-splitter/:projectId
   * Manually deploy splitter contract for a project (Admin/Debug)
   * @protected - Creator only
   */
  async deploySplitter(req, res) {
    try {
      const { projectId } = req.params;

      const result = await investmentService.manuallyDeploySplitter(projectId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Deploy splitter error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to deploy splitter'
      });
    }
  }
}

module.exports = new InvestmentController();
