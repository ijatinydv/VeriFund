const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project.model');

/**
 * Scoring Service
 * Connects to Python FastAPI for AI-powered project scoring
 */
class ScoringService {
  constructor() {
    // In-memory job tracking (use Redis in production)
    this.jobs = new Map();
    
    // Python API configuration
    this.pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    
    // Axios instance with timeout
    this.axiosInstance = axios.create({
      baseURL: this.pythonApiUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Start AI scoring job (fire-and-forget pattern)
   * @param {string} projectId - MongoDB project ID
   * @param {boolean} waitForCompletion - If true, waits for scoring to complete before returning
   * @returns {Promise<Object>} - Job ID and status, or complete scoring result
   */
  async startScoringJob(projectId, waitForCompletion = false) {
    try {
      // Fetch project from database
      const project = await Project.findById(projectId).populate('creator', 'walletAddress name');

      if (!project) {
        throw new Error('Project not found');
      }

      // Generate unique job ID
      const jobId = uuidv4();

      // Initialize job status
      this.jobs.set(jobId, {
        jobId,
        projectId,
        status: 'pending',
        createdAt: new Date(),
        progress: 0
      });

      // Prepare data for Python API - matching the CreatorData schema
      // Correct placeholder data structure with creator performance metrics
      const scoringData = {
        "projects_completed": 25,
        "tenure_months": 36,
        "portfolio_strength": 0.85,
        "on_time_delivery_percent": 0.95,
        "avg_client_rating": 4.7,
        "rating_trajectory": 0.15,
        "dispute_rate": 0.03,
        "project_category": project.category || "Technology"
      };

      if (waitForCompletion) {
        // Wait for scoring to complete and return the result
        console.log(`[Job ${jobId}] Running in synchronous mode - waiting for completion`);
        const result = await this._executeScoring(jobId, projectId, scoringData);
        return {
          jobId,
          status: 'completed',
          message: 'Scoring completed successfully',
          result: {
            trustScore: result.trustScore,
            riskLevel: result.riskLevel,
            aiAnalysis: result.aiAnalysis
          }
        };
      } else {
        // Fire-and-forget: Start async process without awaiting
        // The promise will resolve in the background
        this._executeScoring(jobId, projectId, scoringData)
          .catch(error => {
            console.error(`Background scoring job ${jobId} failed:`, error);
            this.jobs.set(jobId, {
              ...this.jobs.get(jobId),
              status: 'failed',
              error: error.message,
              completedAt: new Date()
            });
          });

        // Return immediately with job ID
        return {
          jobId,
          status: 'pending',
          message: 'Scoring job started successfully',
          estimatedTime: '30-60 seconds'
        };
      }

    } catch (error) {
      console.error('Start scoring job error:', error);
      throw new Error(`Failed to start scoring job: ${error.message}`);
    }
  }

  /**
   * Execute scoring request and update database (background process)
   * @private
   * @param {string} jobId - Job identifier
   * @param {string} projectId - Project ID
   * @param {Object} scoringData - Data to send to Python API
   */
  async _executeScoring(jobId, projectId, scoringData) {
    try {
      // Update job status to processing
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'processing',
        progress: 10
      });

      console.log(`[Job ${jobId}] Sending scoring request to Python API...`);
      console.log(`[Job ${jobId}] Data:`, JSON.stringify(scoringData, null, 2));

      let trust_score, risk_level, analysis;

      try {
        // Try Python API first
        const response = await this.axiosInstance.post('/score', scoringData);

        // Update progress
        this.jobs.set(jobId, {
          ...this.jobs.get(jobId),
          progress: 80
        });

        console.log(`[Job ${jobId}] Received response from Python API:`, response.data);

        // Extract scores from response
        const { projectSuccessScore, reasons } = response.data;
        
        // Convert projectSuccessScore to trustScore (0-100)
        trust_score = Math.round(projectSuccessScore);
        
        // Determine risk level based on score
        if (trust_score >= 80) {
          risk_level = 'Low';
        } else if (trust_score >= 60) {
          risk_level = 'Medium';
        } else {
          risk_level = 'High';
        }
        
        // Create analysis summary from reasons
        analysis = reasons && reasons.length > 0 
          ? reasons.map(r => 
              `${r.feature}: ${r.value} (impact: ${r.impact > 0 ? '+' : ''}${r.impact})`
            ).join('; ')
          : 'AI analysis completed successfully';

      } catch (apiError) {
        console.warn(`[Job ${jobId}] Python API failed, using fallback scoring:`, apiError.message);
        
        // FALLBACK: Calculate score based on input metrics
        const fallbackScore = this._calculateFallbackScore(scoringData);
        trust_score = fallbackScore.trustScore;
        risk_level = fallbackScore.riskLevel;
        analysis = fallbackScore.analysis;
        
        console.log(`[Job ${jobId}] Fallback score: ${trust_score}, Risk: ${risk_level}`);
      }

      // Update project in database
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        {
          trustScore: trust_score,
          riskLevel: risk_level,
          aiAnalysis: analysis,
          scoredAt: new Date()
        },
        { new: true }
      );

      // Mark job as completed
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'completed',
        progress: 100,
        result: {
          trustScore: trust_score,
          riskLevel: risk_level,
          aiAnalysis: analysis
        },
        completedAt: new Date()
      });

      console.log(`[Job ${jobId}] Successfully updated project with AI scores: trustScore=${trust_score}, riskLevel=${risk_level}`);

      return {
        trustScore: trust_score,
        riskLevel: risk_level,
        aiAnalysis: analysis,
        scoredAt: new Date()
      };

    } catch (error) {
      console.error(`[Job ${jobId}] Scoring execution failed:`, error);
      
      // Update job with error
      this.jobs.set(jobId, {
        ...this.jobs.get(jobId),
        status: 'failed',
        error: error.response?.data?.detail || error.message,
        completedAt: new Date()
      });

      throw error;
    }
  }

  /**
   * Calculate fallback score when Python API is unavailable
   * @private
   * @param {Object} data - Scoring data
   * @returns {Object} - Score, risk level, and analysis
   */
  _calculateFallbackScore(data) {
    // Weighted scoring algorithm
    const weights = {
      portfolio_strength: 0.25,
      on_time_delivery_percent: 0.20,
      avg_client_rating: 0.20,
      projects_completed: 0.15,
      tenure_months: 0.10,
      dispute_rate: 0.10
    };

    // Normalize and score each factor (0-100 scale)
    const scores = {
      portfolio_strength: data.portfolio_strength * 100,
      on_time_delivery_percent: data.on_time_delivery_percent * 100,
      avg_client_rating: ((data.avg_client_rating - 3.5) / 1.5) * 100, // 3.5-5.0 → 0-100
      projects_completed: Math.min((data.projects_completed / 50) * 100, 100),
      tenure_months: Math.min((data.tenure_months / 60) * 100, 100),
      dispute_rate: (1 - (data.dispute_rate / 0.15)) * 100 // Lower is better
    };

    // Calculate weighted average
    let trustScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      trustScore += scores[key] * weight;
    }

    // Ensure score is in valid range
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

    // Determine risk level
    let riskLevel;
    if (trustScore >= 75) {
      riskLevel = 'Low';
    } else if (trustScore >= 50) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'High';
    }

    // Create analysis
    const topFactors = Object.entries(scores)
      .map(([key, score]) => ({
        feature: key.replace(/_/g, ' '),
        score: Math.round(score),
        value: data[key]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const analysis = `Fallback Analysis - ${topFactors.map(f => 
      `${f.feature}: ${typeof f.value === 'number' ? f.value.toFixed(2) : f.value} (score: ${f.score})`
    ).join('; ')}. Category: ${data.project_category}`;

    return { trustScore, riskLevel, analysis };
  }

  /**
   * Get job status
   * @param {string} jobId - Job identifier
   * @returns {Object} - Job status and details
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      ...job,
      elapsed: job.completedAt 
        ? Math.round((job.completedAt - job.createdAt) / 1000) 
        : Math.round((new Date() - job.createdAt) / 1000)
    };
  }

  /**
   * Get all jobs for a project
   * @param {string} projectId - Project ID
   * @returns {Array} - List of jobs
   */
  getProjectJobs(projectId) {
    const projectJobs = [];
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.projectId === projectId) {
        projectJobs.push(job);
      }
    }

    return projectJobs.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Clear old completed jobs (call periodically)
   * @param {number} maxAgeHours - Maximum age in hours (default: 24)
   */
  clearOldJobs(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let clearedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cutoffTime) {
        this.jobs.delete(jobId);
        clearedCount++;
      }
    }

    console.log(`Cleared ${clearedCount} old scoring jobs`);
    return clearedCount;
  }

  /**
   * Map project category to AI service format
   * @private
   * @param {string} category - Project category
   * @returns {string} - Mapped category for AI service
   */
  _mapCategoryToAIFormat(category) {
    const categoryMap = {
      'Technology': 'Web Development',
      'Healthcare': 'Mobile Development',
      'Education': 'UI/UX Design',
      'Finance': 'Web Development',
      'E-commerce': 'Web Development',
      'Other': 'Graphic Design'
    };
    
    return categoryMap[category] || 'Web Development';
  }

  /**
   * Trigger re-scoring from GitHub webhook
   * @param {Object} payload - GitHub webhook payload
   * @returns {Promise<Object>} - Re-scoring job details
   */
  async triggerRescoreFromWebhook(payload) {
    try {
      console.log('Processing GitHub webhook for re-scoring...');
      
      // Extract project ID from various webhook payload sources
      let projectId = null;

      // Strategy 1: Check commit messages for project ID
      if (payload.commits && Array.isArray(payload.commits)) {
        for (const commit of payload.commits) {
          const message = commit.message || '';
          // Look for pattern like "projectId:abc123" or "#projectId:abc123"
          const match = message.match(/(?:#)?projectId:([a-fA-F0-9]{24})/i);
          if (match) {
            projectId = match[1];
            console.log(`Found project ID in commit message: ${projectId}`);
            break;
          }
        }
      }

      // Strategy 2: Check repository name or description
      if (!projectId && payload.repository) {
        const repoName = payload.repository.name || '';
        const repoDesc = payload.repository.description || '';
        const combinedText = `${repoName} ${repoDesc}`;
        const match = combinedText.match(/(?:#)?projectId:([a-fA-F0-9]{24})/i);
        if (match) {
          projectId = match[1];
          console.log(`Found project ID in repository info: ${projectId}`);
        }
      }

      // Strategy 3: Check for custom webhook metadata (if sent via webhook config)
      if (!projectId && payload.project_id) {
        projectId = payload.project_id;
        console.log(`Found project ID in webhook metadata: ${projectId}`);
      }

      if (!projectId) {
        throw new Error('No project ID found in webhook payload. Include "projectId:YOUR_ID" in commit message or repository description.');
      }

      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error(`Project not found with ID: ${projectId}`);
      }

      console.log(`Triggering re-score for project: ${project.title} (${projectId})`);

      // Start scoring job (fire-and-forget mode)
      const result = await this.startScoringJob(projectId, false);

      return {
        success: true,
        message: 'Re-scoring triggered successfully',
        projectId: projectId,
        projectTitle: project.title,
        jobId: result.jobId,
        webhookEvent: payload.action || payload.ref || 'unknown',
        repository: payload.repository?.full_name || 'unknown'
      };

    } catch (error) {
      console.error('Trigger rescore from webhook error:', error);
      throw new Error(`Failed to trigger re-scoring: ${error.message}`);
    }
  }

  /**
   * Get AI Potential Score for project creation (no project ID needed)
   * @param {Object} aiData - Creator performance data
   * @returns {Promise<number>} - Potential score (0-100)
   */
  async getAIPotentialScore(aiData) {
    try {
      console.log('Calling Python API for potential score with data:', aiData);
      
      // Try to get score from Python API
      try {
        const response = await this.axiosInstance.post('/score', aiData, { timeout: 10000 });
        const { projectSuccessScore } = response.data;
        
        console.log('✅ Python API returned potential score:', projectSuccessScore);
        return Math.round(projectSuccessScore);
      } catch (apiError) {
        console.warn('Python API unavailable, using fallback scoring:', apiError.message);
        
        // Use fallback calculation
        const fallbackResult = this._calculateFallbackScore(aiData);
        console.log('✅ Fallback potential score:', fallbackResult.trustScore);
        return fallbackResult.trustScore;
      }
    } catch (error) {
      console.error('Get AI potential score error:', error);
      // Return default score if all else fails
      return 75;
    }
  }

  /**
   * Health check for Python API
   * @returns {Promise<Object>} - API health status
   */
  async checkApiHealth() {
    try {
      const response = await this.axiosInstance.get('/health', { timeout: 5000 });
      return {
        status: 'healthy',
        message: response.data.message || 'API is running',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = new ScoringService();
