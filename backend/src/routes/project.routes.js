const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Project Routes
 * All routes are prefixed with /api/projects
 */

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Protected - Creator only
 */
router.post(
  '/',
  authenticate,
  authorize('Creator'),
  projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with optional filters
 * @access  Public
 * @query   status, category, page, limit, sort
 */
router.get('/', projectController.getAllProjects);

/**
 * @route   GET /api/projects/my/projects
 * @desc    Get all projects created by authenticated user
 * @access  Protected
 */
router.get('/my/projects', authenticate, projectController.getMyProjects);

/**
 * @route   GET /api/projects/scoring/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/scoring/health', projectController.checkAIServiceHealth);

/**
 * @route   GET /api/projects/scoring/job/:jobId
 * @desc    Get status of a scoring job
 * @access  Public
 */
router.get('/scoring/job/:jobId', projectController.getScoringJobStatus);

/**
 * @route   GET /api/projects/creator/:creatorId
 * @desc    Get all projects by a specific creator
 * @access  Public
 */
router.get('/creator/:creatorId', projectController.getProjectsByCreator);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Public
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   POST /api/projects/:id/score
 * @desc    Trigger AI scoring for a project
 * @access  Protected
 * @query   wait (boolean) - Wait for scoring to complete before returning
 */
router.post('/:id/score', authenticate, projectController.scoreProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Protected - Creator/Owner only
 */
router.put('/:id', authenticate, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Protected - Creator/Owner only
 */
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;
