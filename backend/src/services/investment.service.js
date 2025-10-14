const Investment = require('../models/Investment.model');
const Project = require('../models/Project.model');
const web3Service = require('./web3.service');

/**
 * Investment Service
 * Handles crowd investment logic and splitter contract deployment
 */
class InvestmentService {
  /**
   * Create a new investment
   * @param {Object} investmentData - Investment details
   * @param {string} investmentData.projectId - Project ID
   * @param {string} investmentData.investorId - Investor User ID
   * @param {number} investmentData.amount - Investment amount in INR
   * @param {string} investmentData.transactionHash - Blockchain transaction hash
   * @returns {Promise<Object>} - Created investment and updated project
   */
  async createInvestment({ projectId, investorId, amount, transactionHash }) {
    try {
      // Validate inputs
      if (!projectId || !investorId || !amount || !transactionHash) {
        throw new Error('projectId, investorId, amount, and transactionHash are required');
      }

      if (amount < 1000) {
        throw new Error('Minimum investment amount is ₹1,000');
      }

      // Find the project
      const project = await Project.findById(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify project is in Funding status
      if (project.status !== 'Funding') {
        throw new Error(`This project is no longer accepting investments. Current status: ${project.status}`);
      }

      // Prevent creator from investing in their own project
      if (project.creator.toString() === investorId.toString()) {
        throw new Error('Creators cannot invest in their own project');
      }

      // Check if funding goal would be exceeded
      const newTotal = project.currentFundingInr + amount;
      if (newTotal > project.fundingGoalInr) {
        throw new Error(`Investment would exceed funding goal. Available: ₹${project.fundingGoalInr - project.currentFundingInr}`);
      }

      // Add investment to project's investments array
      project.investments.push({
        investor: investorId,
        amount: amount
      });

      // Update project funding metrics
      project.currentFundingInr += amount;
      project.investorCount += 1;

      // Calculate initial share percentage (will be finalized when splitter is deployed)
      const sharePercent = (amount / project.fundingGoalInr) * 100;

      // Save the updated project
      await project.save();

      console.log(`Investment added to project: ₹${amount} by investor ${investorId}`);
      console.log(`Project funding: ₹${project.currentFundingInr} / ₹${project.fundingGoalInr}`);

      // Create investment record
      const investment = await Investment.create({
        investor: investorId,
        project: projectId,
        amountInr: amount,
        sharePercent: sharePercent,
        transactionHash: transactionHash,
        status: 'Confirmed'
      });

      // CRUCIAL: Check if funding goal is met
      const isFunded = project.currentFundingInr >= project.fundingGoalInr;
      const hasNoSplitter = !project.splitterContractAddress;

      console.log(`Funding check: isFunded=${isFunded}, hasNoSplitter=${hasNoSplitter}`);

      if (isFunded && hasNoSplitter) {
        console.log('🎉 Funding goal reached! Deploying splitter contract...');
        
        // Deploy splitter contract automatically
        try {
          // Fetch all investments for this project with investor details
          const allInvestments = await Investment.find({ project: projectId })
            .populate('investor', 'walletAddress name');
          
          // Populate project creator details
          await project.populate('creator', 'walletAddress name');
          
          // Deploy using new web3 service method
          const contractAddress = await web3Service.deploySplitterContract(project, allInvestments);
          
          // Update project with splitter address and status
          project.splitterContractAddress = contractAddress;
          project.status = 'Live';
          await project.save();

          console.log(`✅ Splitter deployed at: ${contractAddress}`);

          return {
            investment: investment,
            project: project,
            splitterDeployed: true,
            splitterAddress: contractAddress,
            message: 'Investment successful! Funding goal reached and splitter contract deployed.'
          };

        } catch (deployError) {
          console.error('Splitter deployment failed:', deployError);
          
          // Investment is still recorded, but splitter deployment failed
          // Mark project status as needing manual deployment
          project.status = 'Funding'; // Keep in funding status for manual intervention
          await project.save();
          
          return {
            investment: investment,
            project: project,
            splitterDeployed: false,
            error: deployError.message,
            message: 'Investment successful, but splitter deployment failed. Manual deployment required.'
          };
        }
      }

      // Normal case: investment recorded, goal not yet met
      return {
        investment: investment,
        project: project,
        splitterDeployed: false,
        message: 'Investment successful',
        fundingProgress: Math.round((project.currentFundingInr / project.fundingGoalInr) * 100)
      };

    } catch (error) {
      console.error('Create investment error:', error);
      throw new Error(`Failed to create investment: ${error.message}`);
    }
  }

  /**
   * Deploy splitter contract for a funded project
   * @private
   * @param {Object} project - Project document with investments array
   * @returns {Promise<Object>} - Deployment result
   * @deprecated - Use web3Service.deploySplitterContract directly
   */
  async _deploySplitterForProject(project) {
    // This method is kept for backward compatibility but is deprecated
    // New code should use web3Service.deploySplitterContract directly
    const allInvestments = await Investment.find({ project: project._id })
      .populate('investor', 'walletAddress name');
    
    await project.populate('creator', 'walletAddress name');
    
    const contractAddress = await web3Service.deploySplitterContract(project, allInvestments);
    
    return { contractAddress };
  }

  /**
   * Get all investments for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of investments
   */
  async getProjectInvestments(projectId) {
    try {
      const investments = await Investment.find({ project: projectId })
        .populate('investor', 'walletAddress name email')
        .sort({ createdAt: -1 });

      return investments;

    } catch (error) {
      console.error('Get project investments error:', error);
      throw new Error(`Failed to get investments: ${error.message}`);
    }
  }

  /**
   * Get all investments for an investor
   * @param {string} investorId - Investor User ID
   * @returns {Promise<Array>} - List of investments
   */
  async getInvestorInvestments(investorId) {
    try {
      const investments = await Investment.find({ investor: investorId })
        .populate('project', 'title category status currentFundingInr fundingGoalInr imageUrl')
        .sort({ createdAt: -1 });

      return investments;

    } catch (error) {
      console.error('Get investor investments error:', error);
      throw new Error(`Failed to get investments: ${error.message}`);
    }
  }

  /**
   * Get investment statistics for an investor
   * @param {string} investorId - Investor User ID
   * @returns {Promise<Object>} - Investment statistics
   */
  async getInvestorStats(investorId) {
    try {
      const investments = await Investment.find({ investor: investorId, status: 'Confirmed' });

      const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInr, 0);
      const projectCount = new Set(investments.map(inv => inv.project.toString())).size;

      return {
        totalInvested: totalInvested,
        projectCount: projectCount,
        investmentCount: investments.length,
        averageInvestment: projectCount > 0 ? Math.round(totalInvested / projectCount) : 0
      };

    } catch (error) {
      console.error('Get investor stats error:', error);
      throw new Error(`Failed to get investor stats: ${error.message}`);
    }
  }

  /**
   * Manually trigger splitter deployment for a funded project
   * (Admin/debugging function)
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Deployment result
   */
  async manuallyDeploySplitter(projectId) {
    try {
      const project = await Project.findById(projectId)
        .populate('creator', 'walletAddress name');

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.splitterContractAddress) {
        throw new Error('Splitter contract already deployed');
      }

      if (project.currentFundingInr < project.fundingGoalInr) {
        throw new Error('Funding goal not yet reached');
      }

      if (!project.investments || project.investments.length === 0) {
        throw new Error('No investments found for this project');
      }

      // Fetch all investments with investor details
      const allInvestments = await Investment.find({ project: projectId })
        .populate('investor', 'walletAddress name');

      // Deploy using web3 service
      const contractAddress = await web3Service.deploySplitterContract(project, allInvestments);

      // Update project
      project.splitterContractAddress = contractAddress;
      project.status = 'Live';
      await project.save();

      return {
        success: true,
        message: 'Splitter contract deployed successfully',
        contractAddress: contractAddress,
        project: project
      };

    } catch (error) {
      console.error('Manually deploy splitter error:', error);
      throw new Error(`Failed to manually deploy splitter: ${error.message}`);
    }
  }
}

module.exports = new InvestmentService();
