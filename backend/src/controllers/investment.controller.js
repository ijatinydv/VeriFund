const Investment = require('../models/Investment.model');
const Project = require('../models/Project.model');

/**
 * Investment Controllers
 * Handle HTTP requests for investment endpoints
 */
class InvestmentController {
  /**
   * POST /api/investments
   * Record a new investment transaction
   */
  async createInvestment(req, res) {
    try {
      const { projectId, amount, currency, transactionHash, blockNumber, tokensReceived } = req.body;
      const userId = req.user.userId;
      const walletAddress = req.user.walletAddress;

      // Validate required fields
      if (!projectId || !amount || !transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'Project ID, amount, and transaction hash are required'
        });
      }

      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if investment already recorded (prevent duplicates)
      const existingInvestment = await Investment.findOne({ transactionHash });
      if (existingInvestment) {
        return res.status(409).json({
          success: false,
          message: 'Investment with this transaction hash already exists'
        });
      }

      // Create investment record
      const investment = await Investment.create({
        project: projectId,
        investor: userId,
        investorAddress: walletAddress,
        amount,
        currency: currency || 'ETH',
        transactionHash,
        blockNumber,
        tokensReceived: tokensReceived || 0,
        status: 'confirmed'
      });

      // Populate project and investor details
      await investment.populate('project', 'title description creator');
      await investment.populate('investor', 'walletAddress name');

      return res.status(201).json({
        success: true,
        message: 'Investment recorded successfully',
        data: {
          investment
        }
      });

    } catch (error) {
      console.error('Create investment error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to record investment'
      });
    }
  }

  /**
   * GET /api/investments/my
   * Get current user's investments
   */
  async getMyInvestments(req, res) {
    try {
      const userId = req.user.userId;

      const investments = await Investment.find({ investor: userId })
        .populate('project', 'title description creator fundingGoal currentFunding status')
        .sort({ createdAt: -1 });

      // Transform data to match frontend expectations
      const transformedInvestments = investments.map(inv => ({
        id: inv._id.toString(),
        projectId: inv.project._id.toString(),
        projectName: inv.project.title,
        amountInvested: inv.amount,
        investmentCurrency: inv.currency,
        revenueShare: 0, // TODO: Calculate from project data
        projectStatus: inv.project.status || 'Active',
        revenueEarned: 0, // TODO: Calculate revenue
        investmentDate: inv.createdAt,
        transactionHash: inv.transactionHash,
        tokensReceived: inv.tokensReceived || 0,
      }));

      return res.status(200).json({
        success: true,
        data: {
          investments: transformedInvestments,
          total: transformedInvestments.length
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
   */
  async getProjectInvestments(req, res) {
    try {
      const { projectId } = req.params;

      const investments = await Investment.find({ project: projectId })
        .populate('investor', 'walletAddress name')
        .sort({ createdAt: -1 });

      // Calculate total investment
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

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
   * GET /api/investments/:id
   * Get a specific investment by ID
   */
  async getInvestmentById(req, res) {
    try {
      const { id } = req.params;

      const investment = await Investment.findById(id)
        .populate('project', 'title description creator fundingGoal')
        .populate('investor', 'walletAddress name');

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          investment
        }
      });

    } catch (error) {
      console.error('Get investment error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch investment'
      });
    }
  }

  /**
   * GET /api/investments/stats/summary
   * Get investment statistics for the current user
   */
  async getInvestmentStats(req, res) {
    try {
      const userId = req.user.userId;

      const investments = await Investment.find({ investor: userId });

      const stats = {
        totalInvestments: investments.length,
        totalInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
        totalTokensReceived: investments.reduce((sum, inv) => sum + (inv.tokensReceived || 0), 0),
        activeProjects: new Set(investments.map(inv => inv.project.toString())).size,
        byStatus: {
          confirmed: investments.filter(inv => inv.status === 'confirmed').length,
          pending: investments.filter(inv => inv.status === 'pending').length,
          failed: investments.filter(inv => inv.status === 'failed').length
        }
      };

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
}

module.exports = new InvestmentController();
