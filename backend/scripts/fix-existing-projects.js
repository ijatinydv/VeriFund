/**
 * Script to fix existing projects
 * - Add default image URLs
 * - Trigger AI scoring for projects without scores
 */

const mongoose = require('mongoose');
const Project = require('../src/models/Project.model');
const User = require('../src/models/User.model');
const scoringService = require('../src/services/scoring.service');
require('dotenv').config();

const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300/0D47A1/FFFFFF?text=Project+Image';

async function fixExistingProjects() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/verifund';
    console.log(`Using MongoDB URI: ${mongoUri.replace(/\/\/.*:.*@/, '//***:***@')}`); // Hide credentials
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Find all projects
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects\n`);

    let fixedImageCount = 0;
    let triggeredScoringCount = 0;

    for (const project of projects) {
      console.log(`Processing project: ${project.title} (${project._id})`);

      let needsSave = false;

      // Fix empty imageUrl
      if (!project.imageUrl || project.imageUrl === '') {
        console.log('  → Adding default image URL');
        project.imageUrl = DEFAULT_IMAGE_URL;
        needsSave = true;
        fixedImageCount++;
      }

      // Save if needed
      if (needsSave) {
        await project.save();
        console.log('  ✓ Project updated');
      }

      // Trigger AI scoring if missing
      if (project.trustScore === null || project.trustScore === undefined) {
        console.log('  → Triggering AI scoring...');
        try {
          const result = await scoringService.startScoringJob(project._id.toString());
          console.log(`  ✓ Scoring job started: ${result.jobId}`);
          triggeredScoringCount++;
          
          // Wait a bit for the job to process
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log(`  ✗ Failed to start scoring: ${error.message}`);
        }
      } else {
        console.log(`  ✓ Already has trust score: ${project.trustScore}`);
      }

      console.log('');
    }

    console.log('\n========================================');
    console.log('Summary:');
    console.log(`  Total projects: ${projects.length}`);
    console.log(`  Fixed image URLs: ${fixedImageCount}`);
    console.log(`  Triggered AI scoring: ${triggeredScoringCount}`);
    console.log('========================================\n');

    console.log('Waiting 5 seconds for scoring jobs to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check results
    console.log('\nChecking scoring results...');
    for (const project of projects) {
      const updated = await Project.findById(project._id);
      if (updated.trustScore !== null) {
        console.log(`✓ ${updated.title}: Score=${updated.trustScore}, Risk=${updated.riskLevel}`);
      } else {
        console.log(`⏳ ${updated.title}: Scoring in progress or failed`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

// Run the script
console.log('\n========================================');
console.log('Fix Existing Projects Script');
console.log('========================================\n');

fixExistingProjects();
