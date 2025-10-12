/**
 * Script to manually score a specific project
 * Usage: node scripts/score-project.js PROJECT_ID
 */

const mongoose = require('mongoose');
const Project = require('../src/models/Project.model');
const User = require('../src/models/User.model');
const scoringService = require('../src/services/scoring.service');
require('dotenv').config();

async function scoreProject(projectId) {
  try {
    console.log('\n========================================');
    console.log('Manual Project Scoring Script');
    console.log('========================================\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/verifund');
    console.log('✓ Connected to MongoDB\n');

    // Check if project exists
    console.log(`Looking for project: ${projectId}`);
    const project = await Project.findById(projectId).populate('creator');
    
    if (!project) {
      console.error('✗ Project not found!');
      process.exit(1);
    }

    console.log(`✓ Found project: "${project.title}"`);
    console.log(`  Category: ${project.category}`);
    console.log(`  Creator: ${project.creator.walletAddress}`);
    console.log(`  Current Trust Score: ${project.trustScore || 'null'}`);
    console.log(`  Current Risk Level: ${project.riskLevel || 'null'}\n`);

    // Check AI service health
    console.log('Checking AI service...');
    const health = await scoringService.checkApiHealth();
    console.log(`  Status: ${health.status}`);
    
    if (health.status !== 'healthy') {
      console.error('✗ AI service is not healthy!');
      console.error('  Make sure Python API is running on http://localhost:8000');
      process.exit(1);
    }
    console.log('✓ AI service is healthy\n');

    // Start scoring job
    console.log('Starting AI scoring job...');
    const jobResult = await scoringService.startScoringJob(projectId);
    console.log(`✓ Job started: ${jobResult.jobId}`);
    console.log(`  Status: ${jobResult.status}`);
    console.log(`  Estimated time: ${jobResult.estimatedTime}\n`);

    // Wait for job to complete (check every second for up to 60 seconds)
    console.log('Waiting for scoring to complete...');
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      try {
        const status = scoringService.getJobStatus(jobResult.jobId);
        process.stdout.write(`\r  Attempt ${attempts}/${maxAttempts} - Status: ${status.status} (${status.progress}%)  `);
        
        if (status.status === 'completed') {
          console.log('\n✓ Scoring completed!\n');
          console.log('Results:');
          console.log(`  Trust Score: ${status.result.trustScore}`);
          console.log(`  Risk Level: ${status.result.riskLevel}`);
          console.log(`  Analysis: ${status.result.analysis}\n`);
          break;
        } else if (status.status === 'failed') {
          console.log('\n✗ Scoring failed!');
          console.log(`  Error: ${status.error}\n`);
          break;
        }
      } catch (error) {
        // Job might not be found yet
      }
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏱ Timeout waiting for scoring to complete');
      console.log('  The job may still be processing in the background\n');
    }

    // Fetch updated project
    const updatedProject = await Project.findById(projectId);
    console.log('Current Project State:');
    console.log(`  Trust Score: ${updatedProject.trustScore || 'null'}`);
    console.log(`  Risk Level: ${updatedProject.riskLevel || 'null'}`);
    console.log(`  AI Analysis: ${updatedProject.aiAnalysis ? updatedProject.aiAnalysis.substring(0, 100) + '...' : 'null'}`);
    console.log(`  Scored At: ${updatedProject.scoredAt || 'null'}\n`);

    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    process.exit(0);
  }
}

// Get project ID from command line args
const projectId = process.argv[2];

if (!projectId) {
  console.error('\n❌ Usage: node scripts/score-project.js PROJECT_ID\n');
  console.error('Example: node scripts/score-project.js 68ea9f77d02e168766e36715\n');
  process.exit(1);
}

scoreProject(projectId);
