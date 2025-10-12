const Project = require('../models/Project.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');
const scoringService = require('./scoring.service');

/**
 * Project Service
 * Contains business logic for project operations
 */
class ProjectService {
  /**
   * Create a new project
   * @param {Object} projectData - Project information
   * @param {string} creatorId - User ID of the project creator
   * @returns {Promise<Object>} - Created project with populated creator
   */
  async createProject(projectData, creatorId) {
    try {
      // Validate creator exists and has Creator role
      const creator = await User.findById(creatorId);

      if (!creator) {
        throw new Error('Creator not found');
      }

      if (creator.role !== 'Creator') {
        throw new Error('Only users with Creator role can create projects');
      }

      // Validate required fields
      const requiredFields = ['title', 'fundingGoalInr', 'revenueSharePercent'];
      for (const field of requiredFields) {
        if (!projectData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Create project with creator reference
      const project = await Project.create({
        ...projectData,
        creator: creatorId,
        status: 'Pending', // Start in Pending status
        currentFundingInr: 0,
        investorCount: 0,
        imageUrl: projectData.imageUrl || 'https://via.placeholder.com/400x300/0D47A1/FFFFFF?text=Project+Image'
      });

      // Populate creator details
      await project.populate('creator', 'walletAddress name role');

      console.log('🎯 Starting AI scoring for project:', project._id);

      // Trigger AI scoring synchronously with timeout
      try {
        // Set a timeout promise (5 seconds max wait)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scoring timeout')), 5000)
        );

        // Race between scoring and timeout
        const scoringResult = await Promise.race([
          scoringService.startScoringJob(project._id.toString(), true), // Wait for completion
          timeoutPromise
        ]);

        if (scoringResult && scoringResult.result) {
          // Update project with AI scores
          project.trustScore = scoringResult.result.trustScore;
          project.riskLevel = scoringResult.result.riskLevel;
          project.aiAnalysis = scoringResult.result.aiAnalysis;
          project.scoredAt = new Date();
          
          console.log('✅ AI scoring completed successfully:', {
            trustScore: project.trustScore,
            riskLevel: project.riskLevel
          });
        }
      } catch (scoringError) {
        // Log error but don't fail project creation
        console.warn('⚠️ AI scoring failed or timed out, project created without scores:', scoringError.message);
        
        // Trigger background scoring as fallback
        scoringService.startScoringJob(project._id.toString(), false)
          .catch(err => console.error('Background scoring also failed:', err));
      }

      return project;

    } catch (error) {
      console.error('Create project error:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Get all projects with optional filters and pagination
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status (optional)
   * @param {string} options.category - Filter by category (optional)
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.sort - Sort field (default: -createdAt)
   * @returns {Promise<Object>} - Projects with pagination metadata
   */
  async getAllProjects(options = {}) {
    try {
      const {
        status,
        category,
        page = 1,
        limit = 10,
        sort = '-createdAt'
      } = options;

      // Build query filter
      const filter = {};
      
      // If status is explicitly provided, use it; otherwise show all projects
      if (status) {
        filter.status = status;
      }

      if (category) {
        filter.category = category;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [projects, totalCount] = await Promise.all([
        Project.find(filter)
          .populate('creator', 'walletAddress name role email')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(), // Convert to plain JavaScript objects for better performance
        Project.countDocuments(filter)
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      };

    } catch (error) {
      console.error('Get all projects error:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  }

  /**
   * Get a single project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Project with populated creator
   */
  async getProjectById(projectId) {
    try {
      // Validate project ID format
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID format');
      }

      // Find project and populate creator
      const project = await Project.findById(projectId)
        .populate('creator', 'walletAddress name role email');

      if (!project) {
        throw new Error('Project not found');
      }

      return project;

    } catch (error) {
      console.error('Get project by ID error:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  /**
   * Update project details
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID making the update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated project
   */
  async updateProject(projectId, userId, updateData) {
    try {
      // Validate project ID
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID format');
      }

      // Find project
      const project = await Project.findById(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify user is the creator
      if (project.creator.toString() !== userId) {
        throw new Error('Only the project creator can update this project');
      }

      // Prevent updating certain protected fields
      const protectedFields = ['creator', 'currentFundingInr', 'investorCount'];
      protectedFields.forEach(field => delete updateData[field]);

      // Update project
      Object.assign(project, updateData);
      await project.save();

      // Populate and return
      await project.populate('creator', 'walletAddress name role');

      return project;

    } catch (error) {
      console.error('Update project error:', error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID making the deletion
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteProject(projectId, userId) {
    try {
      // Validate project ID
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID format');
      }

      // Find project
      const project = await Project.findById(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify user is the creator
      if (project.creator.toString() !== userId) {
        throw new Error('Only the project creator can delete this project');
      }

      // Prevent deletion if project has funding
      if (project.currentFundingInr > 0) {
        throw new Error('Cannot delete project with existing funding');
      }

      // Delete project
      await Project.findByIdAndDelete(projectId);

      return {
        message: 'Project deleted successfully',
        projectId
      };

    } catch (error) {
      console.error('Delete project error:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Get projects by creator
   * @param {string} creatorId - Creator user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Creator's projects with pagination
   */
  async getProjectsByCreator(creatorId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;

      const filter = { creator: creatorId };
      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;

      const [projects, totalCount] = await Promise.all([
        Project.find(filter)
          .populate('creator', 'walletAddress name role')
          .sort('-createdAt')
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Project.countDocuments(filter)
      ]);

      return {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit: parseInt(limit)
        }
      };

    } catch (error) {
      console.error('Get projects by creator error:', error);
      throw new Error(`Failed to fetch creator projects: ${error.message}`);
    }
  }

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {string} newStatus - New status value
   * @returns {Promise<Object>} - Updated project
   */
  async updateProjectStatus(projectId, newStatus) {
    try {
      const validStatuses = ['Pending', 'Funding', 'Live', 'Completed', 'Cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const project = await Project.findById(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      project.status = newStatus;
      await project.save();

      await project.populate('creator', 'walletAddress name role');

      return project;

    } catch (error) {
      console.error('Update project status error:', error);
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }
}

module.exports = new ProjectService();
