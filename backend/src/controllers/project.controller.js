const projectService = require('../services/project.service');
const scoringService = require('../services/scoring.service');

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

      // Create project
      const project = await projectService.createProject(projectData, creatorId);

      return res.status(201).json({
        success: true,
        message: 'Project created successfully',
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
}

module.exports = new ProjectController();
