const scoringService = require('../services/scoring.service');
const web3Service = require('../services/web3.service');
const Project = require('../models/Project.model');

/**
 * Integration Controllers
 * Handle requests for AI and Blockchain integrations
 */
class IntegrationController {
  /**
   * POST /api/integrations/projects/:id/score
   * Start AI scoring job for a project
   * @protected - Creator only
   */
  async startProjectScoring(req, res) {
    try {
      const { id: projectId } = req.params;

      // Start scoring job (fire-and-forget)
      const result = await scoringService.startScoringJob(projectId);

      return res.status(202).json({
        success: true,
        message: 'Scoring job started',
        data: result
      });

    } catch (error) {
      console.error('Start project scoring error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to start scoring job'
      });
    }
  }

  /**
   * GET /api/integrations/jobs/:jobId/status
   * Get status of a scoring job
   * @public
   */
  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;

      const status = scoringService.getJobStatus(jobId);

      return res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Get job status error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Job not found'
      });
    }
  }

  /**
   * POST /api/integrations/consent/log
   * Log user consent on blockchain
   * @protected
   */
  async logConsent(req, res) {
    try {
      const { userAddress, consentType, documentHash } = req.body;

      // Validate required fields
      if (!userAddress || !consentType || !documentHash) {
        return res.status(400).json({
          success: false,
          message: 'userAddress, consentType, and documentHash are required'
        });
      }

      const result = await web3Service.logConsent(userAddress, consentType, documentHash);

      return res.status(200).json({
        success: true,
        message: 'Consent logged on blockchain',
        data: result
      });

    } catch (error) {
      console.error('Log consent error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to log consent'
      });
    }
  }

  /**
   * POST /api/integrations/tokens/mint
   * Mint security token for investor
   * @protected
   */
  async mintSecurityToken(req, res) {
    try {
      const { tokenContractAddress, investorAddress, projectId } = req.body;

      // Validate required fields
      if (!tokenContractAddress || !investorAddress || !projectId) {
        return res.status(400).json({
          success: false,
          message: 'tokenContractAddress, investorAddress, and projectId are required'
        });
      }

      const result = await web3Service.mintToken(tokenContractAddress, investorAddress, projectId);

      return res.status(200).json({
        success: true,
        message: 'Security token minted successfully',
        data: result
      });

    } catch (error) {
      console.error('Mint token error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to mint token'
      });
    }
  }

  /**
   * POST /api/integrations/splitter/deploy
   * Deploy revenue splitter contract
   * @protected - Creator only
   */
  async deploySplitter(req, res) {
    try {
      const { projectId, investors, shares, fundingCapInr } = req.body;

      // Validate required fields
      if (!projectId || !investors || !shares) {
        return res.status(400).json({
          success: false,
          message: 'projectId, investors, and shares are required'
        });
      }

      // Get project to validate ownership
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Verify user is creator
      if (project.creator.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project creator can deploy splitter contract'
        });
      }

      // Convert INR to Wei (simplified - in production, use proper exchange rate)
      // Assuming 1 ETH = 200,000 INR (example rate)
      const ethToInr = 200000;
      const fundingCapEth = (fundingCapInr || project.fundingGoalInr) / ethToInr;
      const fundingCapWei = ethers.parseEther(fundingCapEth.toString());

      // Deploy contract
      const result = await web3Service.deploySplitterContract(
        investors,
        shares,
        fundingCapWei.toString()
      );

      // Update project with contract address
      project.splitterContractAddress = result.contractAddress;
      await project.save();

      return res.status(201).json({
        success: true,
        message: 'Splitter contract deployed successfully',
        data: result
      });

    } catch (error) {
      console.error('Deploy splitter error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to deploy splitter contract'
      });
    }
  }

  /**
   * GET /api/integrations/health
   * Check health of integration services
   * @public
   */
  async checkHealth(req, res) {
    try {
      // Check Python API
      const pythonHealth = await scoringService.checkApiHealth();

      // Check blockchain connection
      let blockchainHealth;
      try {
        const balance = await web3Service.getWalletBalance();
        const gasPrice = await web3Service.getGasPrice();
        
        blockchainHealth = {
          status: 'healthy',
          walletBalance: `${balance} ETH`,
          gasPrice: `${gasPrice} Gwei`,
          network: web3Service.networkConfig.name
        };
      } catch (error) {
        blockchainHealth = {
          status: 'unhealthy',
          error: error.message
        };
      }

      return res.status(200).json({
        success: true,
        services: {
          python_api: pythonHealth,
          blockchain: blockchainHealth
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Health check failed'
      });
    }
  }

  /**
   * GET /api/integrations/transactions/:txHash
   * Get transaction details
   * @public
   */
  async getTransaction(req, res) {
    try {
      const { txHash } = req.params;

      const receipt = await web3Service.getTransactionReceipt(txHash);

      return res.status(200).json({
        success: true,
        data: receipt
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Transaction not found'
      });
    }
  }
}

module.exports = new IntegrationController();
