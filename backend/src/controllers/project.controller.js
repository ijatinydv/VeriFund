const projectService = require('../services/project.service');
const scoringService = require('../services/scoring.service');
const web3Service = require('../services/web3.service');
const User = require('../models/User.model');
const { ethers } = require('ethers');

/**
 * Project Controllers
 * Handle HTTP requests for project endpoints
 */
class ProjectController {
  /**
   * POST /api/projects
   * Create a new project
   * @protected - Requires authentication and Creator role
   */
  async createProject(req, res) {
    try {
      const projectData = req.body;
      const creatorId = req.user.userId;

      // Validate that user has Creator role
      if (req.user.role !== 'Creator') {
        return res.status(403).json({
          success: false,
          message: 'Only users with Creator role can create projects'
        });
      }

      // Get creator's wallet address for contract deployment
      const creator = await User.findById(creatorId);
      if (!creator || !creator.walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Creator wallet address not found. Please connect your wallet.'
        });
      }

      // Extract and format social/professional links
      const links = {
        github: projectData.githubUrl || '',
        linkedin: projectData.linkedinUrl || '',
        portfolio: projectData.portfolioUrl || '',
        twitter: projectData.twitterUrl || '',
        dribbble: projectData.dribbbleUrl || ''
      };

      // Prepare AI data for potential score calculation (hackathon placeholder)
      const aiData = {
        projects_completed: 15,
        tenure_months: 24,
        portfolio_strength: 0.75,
        on_time_delivery_percent: 0.88,
        avg_client_rating: 4.5,
        rating_trajectory: 0.10,
        dispute_rate: 0.05,
        project_category: projectData.category || 'Technology'
      };

      // Calculate AI Potential Score before creating project
      let potentialScore = 75; // Default score
      try {
        console.log('🤖 Calculating AI Potential Score...');
        potentialScore = await scoringService.getAIPotentialScore(aiData);
        console.log('✅ AI Potential Score calculated:', potentialScore);
      } catch (scoringError) {
        console.warn('⚠️ AI scoring failed, using default potential score:', scoringError.message);
      }

      // Deploy VeriFundSplitter contract
      let splitterContractAddress = null;
      try {
        console.log('🚀 Deploying VeriFundSplitter contract...');
        
        // Convert funding goal from INR to ETH (using demo rate: 1 ETH = 250,000 INR)
        const INR_TO_ETH_RATE = 250000;
        const repaymentCapInr = projectData.fundingGoalInr * 1.2; // 120% return cap
        const repaymentCapEth = repaymentCapInr / INR_TO_ETH_RATE;
        const repaymentCapInWei = ethers.parseEther(repaymentCapEth.toString());

        splitterContractAddress = await web3Service.deploySplitterContract(
          creator.walletAddress,
          repaymentCapInWei.toString()
        );
        
        console.log('✅ Contract deployed successfully:', splitterContractAddress);
      } catch (deployError) {
        console.error('❌ Contract deployment failed:', deployError);
        // Don't fail project creation, but log the error
        console.warn('⚠️ Project will be created without splitter contract. Deploy manually later.');
      }

      // Add links, potential score, and contract address to project data
      const enrichedProjectData = {
        ...projectData,
        links,
        potentialScore,
        splitterContractAddress
      };

      // Create project
      const project = await projectService.createProject(enrichedProjectData, creatorId);

      return res.status(201).json({
        success: true,
        message: 'Project created successfully' + (splitterContractAddress ? ' with smart contract deployed' : ''),
        data: project
      });

    } catch (error) {
      console.error('Create project controller error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create project'
      });
    }
  }

  /**
   * POST /api/projects/suggest-price
   * Get AI-powered funding goal suggestion
   * @protected - Requires authentication
   */
  async suggestPrice(req, res) {
    try {
      const { title, description, category, fundingDuration } = req.body;

      // Basic validation
      if (!title || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and category are required'
        });
      }

      // Simple AI-powered price suggestion algorithm
      // In production, this would call the AI service for more sophisticated analysis
      const categoryBasePrice = {
        'Technology': 500000,
        'Finance': 750000,
        'Healthcare': 600000,
        'Education': 400000,
        'E-commerce': 550000,
        'Social Impact': 350000,
        'Entertainment': 450000,
        'Gaming': 500000,
        'Other': 300000,
      };

      const basePrice = categoryBasePrice[category] || 300000;
      
      // Adjust based on description length (complexity indicator)
      const descriptionFactor = Math.min(description.length / 500, 2);
      
      // Adjust based on funding duration
      const durationFactor = fundingDuration ? Math.min(fundingDuration / 30, 2) : 1;
      
      const suggestedPrice = Math.round(basePrice * descriptionFactor * durationFactor);
      const minPrice = Math.round(suggestedPrice * 0.6);
      const maxPrice = Math.round(suggestedPrice * 1.4);

      return res.status(200).json({
        success: true,
        data: {
          suggestedPrice,
          minPrice,
          maxPrice,
          category,
          confidence: 0.85,
          factors: {
            categoryBase: basePrice,
            descriptionComplexity: descriptionFactor,
            durationMultiplier: durationFactor,
          }
        }
      });

    } catch (error) {
      console.error('Suggest price controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate price suggestion'
      });
    }
  }

  /**
   * GET /api/projects
   * Get all projects with optional filters
   * @public
   */
  async getAllProjects(req, res) {
    try {
      const options = {
        status: req.query.status,
        category: req.query.category,
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await projectService.getAllProjects(options);

      return res.status(200).json({
        success: true,
        data: result.projects,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get all projects controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch projects'
      });
    }
  }

  /**
   * GET /api/projects/:id
   * Get a single project by ID
   * @public
   */
  async getProjectById(req, res) {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id);

      return res.status(200).json({
        success: true,
        data: project
      });

    } catch (error) {
      console.error('Get project by ID controller error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Invalid') ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch project'
      });
    }
  }

  /**
   * PUT /api/projects/:id
   * Update a project
   * @protected - Requires authentication and ownership
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      const project = await projectService.updateProject(id, userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project
      });

    } catch (error) {
      console.error('Update project controller error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Only the project creator') ? 403 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update project'
      });
    }
  }

  /**
   * DELETE /api/projects/:id
   * Delete a project
   * @protected - Requires authentication and ownership
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await projectService.deleteProject(id, userId);

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Delete project controller error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Only the project creator') ? 403 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete project'
      });
    }
  }

  /**
   * GET /api/projects/creator/:creatorId
   * Get all projects by a specific creator
   * @public
   */
  async getProjectsByCreator(req, res) {
    try {
      const { creatorId } = req.params;
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        status: req.query.status
      };

      const result = await projectService.getProjectsByCreator(creatorId, options);

      return res.status(200).json({
        success: true,
        data: result.projects,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get projects by creator controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch creator projects'
      });
    }
  }

  /**
   * GET /api/projects/my/projects
   * Get all projects created by the authenticated user
   * @protected - Requires authentication
   */
  async getMyProjects(req, res) {
    try {
      const creatorId = req.user.userId;
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        status: req.query.status
      };

      const result = await projectService.getProjectsByCreator(creatorId, options);

      return res.status(200).json({
        success: true,
        data: result.projects,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get my projects controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch your projects'
      });
    }
  }

  /**
   * POST /api/projects/:id/score
   * Trigger AI scoring for a project
   * @protected - Requires authentication
   */
  async scoreProject(req, res) {
    try {
      const { id } = req.params;
      const waitForResult = req.query.wait === 'true' || req.body.wait === true;

      console.log(`📊 Scoring request for project ${id}, wait=${waitForResult}`);

      // Start scoring job
      const result = await scoringService.startScoringJob(id, waitForResult);

      if (waitForResult && result.status === 'completed') {
        // Return complete scoring results
        return res.status(200).json({
          success: true,
          message: 'Project scored successfully',
          data: result.result
        });
      } else {
        // Return job ID for status polling
        return res.status(202).json({
          success: true,
          message: 'Scoring job started',
          data: {
            jobId: result.jobId,
            status: result.status,
            estimatedTime: result.estimatedTime
          }
        });
      }

    } catch (error) {
      console.error('Score project controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to score project'
      });
    }
  }

  /**
   * GET /api/projects/scoring/job/:jobId
   * Get status of a scoring job
   * @public
   */
  async getScoringJobStatus(req, res) {
    try {
      const { jobId } = req.params;

      const jobStatus = scoringService.getJobStatus(jobId);

      return res.status(200).json({
        success: true,
        data: jobStatus
      });

    } catch (error) {
      console.error('Get scoring job status error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Job not found'
      });
    }
  }

  /**
   * GET /api/projects/scoring/health
   * Check AI service health
   * @public
   */
  async checkAIServiceHealth(req, res) {
    try {
      const health = await scoringService.checkApiHealth();

      return res.status(health.status === 'healthy' ? 200 : 503).json({
        success: health.status === 'healthy',
        data: health
      });

    } catch (error) {
      console.error('Check AI service health error:', error);
      return res.status(503).json({
        success: false,
        message: 'AI service unavailable'
      });
    }
  }

  /**
   * POST /api/projects/:projectId/simulate-payout
   * Simulate a revenue payout by sending test ETH to the project's splitter contract
   * @protected - Admin only (for testing purposes)
   */
  async simulatePayout(req, res) {
    try {
      const { projectId } = req.params;
      const { amount } = req.body;

      console.log(`\n💸 Payout simulation request for project ${projectId}`);

      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount (in ETH) is required'
        });
      }

      // Find the project
      const Project = require('../models/Project.model');
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if project has a deployed splitter contract
      if (!project.splitterContractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Project does not have a deployed splitter contract'
        });
      }

      console.log(`📍 Project: ${project.title}`);
      console.log(`📍 Contract: ${project.splitterContractAddress}`);

      // Simulate the payout using web3 service
      const web3Service = require('../services/web3.service');
      const result = await web3Service.simulatePayout(
        project.splitterContractAddress,
        amount.toString()
      );

      return res.status(200).json({
        success: true,
        message: `Successfully sent ${amount} ETH to splitter contract`,
        data: {
          ...result,
          project: {
            id: project._id,
            title: project.title,
            contractAddress: project.splitterContractAddress
          }
        }
      });

    } catch (error) {
      console.error('Simulate payout controller error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Insufficient') ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to simulate payout'
      });
    }
  }
}

module.exports = new ProjectController();
