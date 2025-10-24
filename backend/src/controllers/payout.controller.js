const Project = require('../models/Project.model');
const User = require('../models/User.model');
const web3Service = require('../services/web3.service');
const { ethers } = require('ethers');

/**
 * Generate UPI QR Code for Project Payout
 * @route GET /api/payout/upi-qr/:projectId
 * @access Private (Creator only)
 */
exports.generateUpiQrCode = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project
    const project = await Project.findById(projectId).populate('creator', 'name walletAddress');

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Authorization: Ensure only the project creator can cash out
    // Note: req.user.userId comes from auth middleware
    if (project.creator._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to perform this action. Only the project creator can cash out.' 
      });
    }

    // --- Demo Logic for Hackathon ---
    // Calculate payout amount: 15% of the amount raised as creator's share
    const payoutAmount = (project.currentFundingInr * 0.15).toFixed(2);
    
    // Demo creator information
    const creatorName = project.creator.name || "VeriFund Creator";
    const recipientUpi = "anjali-demo@ybl"; // Demo UPI ID for hackathon
    const note = `Payout for ${project.title}`;

    // Construct UPI payment string following UPI deep link specification
    // Format: upi://pay?pa=<UPI_ID>&pn=<Name>&am=<Amount>&cu=<Currency>&tn=<Note>
    const upiString = `upi://pay?pa=${recipientUpi}&pn=${encodeURIComponent(creatorName)}&am=${payoutAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    console.log(`✅ UPI QR Code generated for project: ${project.title}`);
    console.log(`   Payout Amount: ₹${payoutAmount}`);
    console.log(`   Creator: ${creatorName}`);

    res.status(200).json({ 
      success: true,
      data: {
        upiString,
        payoutAmount: parseFloat(payoutAmount),
        projectTitle: project.title,
        creatorName,
        recipientUpi
      }
    });

  } catch (error) {
    console.error('❌ Error generating UPI QR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating UPI QR code.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Payout Summary for a Project
 * @route GET /api/payout/summary/:projectId
 * @access Private (Creator only)
 */
exports.getPayoutSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).populate('creator', 'name');

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Authorization check
    if (project.creator._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this payout summary.' 
      });
    }

    // Calculate payout details
    const totalFunded = project.currentFundingInr;
    const creatorSharePercent = 15; // Demo: 15% goes to creator
    const platformFeePercent = 5; // Demo: 5% platform fee
    const investorSharePercent = 80; // Demo: 80% to investors

    const payoutSummary = {
      projectTitle: project.title,
      totalFunded,
      creatorShare: (totalFunded * creatorSharePercent / 100).toFixed(2),
      platformFee: (totalFunded * platformFeePercent / 100).toFixed(2),
      investorShare: (totalFunded * investorSharePercent / 100).toFixed(2),
      creatorSharePercent,
      platformFeePercent,
      investorSharePercent,
      availableForCashOut: (totalFunded * creatorSharePercent / 100).toFixed(2)
    };

    res.status(200).json({ 
      success: true,
      data: payoutSummary
    });

  } catch (error) {
    console.error('❌ Error fetching payout summary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching payout summary.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Initiate UPI Payout (Simulated Push Payment)
 * @route POST /api/payout/:projectId/initiate
 * @access Private (Creator only)
 */
exports.initiateUpiPayout = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project and populate creator
    const project = await Project.findById(projectId).populate('creator', 'name walletAddress');

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Authorization: Ensure only the project creator can initiate payout
    if (project.creator._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized. Only the project creator can initiate payout.' 
      });
    }

    // Check if project has a deployed splitter contract
    if (!project.splitterContractAddress) {
      return res.status(400).json({
        success: false,
        message: 'This project does not have a deployed payment contract yet. Payouts are not available.'
      });
    }

    // Get pending payout from smart contract
    console.log(`\n🚀 Initiating UPI payout for project: ${project.title}`);
    console.log(`   Creator: ${req.user.walletAddress}`);
    console.log(`   Contract: ${project.splitterContractAddress}`);

    let amountInWei;
    try {
      amountInWei = await web3Service.getPendingPayout(
        project.splitterContractAddress,
        req.user.walletAddress
      );
    } catch (error) {
      console.error('❌ Error reading from contract:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to read payout amount from blockchain contract.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Convert wei to ETH
    const amountInEth = parseFloat(ethers.formatEther(amountInWei));

    // Convert ETH to INR (Demo rate: 1 ETH = 250,000 INR)
    const ETH_TO_INR_RATE = 250000;
    const payoutAmountInr = (amountInEth * ETH_TO_INR_RATE).toFixed(2);

    console.log(`💰 Amount: ${amountInEth} ETH = ₹${payoutAmountInr}`);

    // Fetch user's UPI ID
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const recipientUpi = user.upiId || 'not-set@upi';

    if (!user.upiId) {
      console.warn('⚠️  User has no UPI ID set. Using placeholder.');
    }

    // Simulate 2-second payout processing
    console.log('⏳ Simulating payout processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate fake transaction receipt
    const receipt = {
      success: true,
      message: 'Payout processed successfully!',
      payoutAmount: payoutAmountInr,
      payoutAmountEth: amountInEth.toFixed(6),
      recipientUpi,
      recipientName: user.name || 'VeriFund Creator',
      transactionId: `VF-PAY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      projectTitle: project.title,
      projectId: project._id
    };

    console.log(`✅ Payout simulated successfully!`);
    console.log(`   Transaction ID: ${receipt.transactionId}`);
    console.log(`   Amount: ₹${payoutAmountInr} to ${recipientUpi}\n`);

    res.status(200).json({
      success: true,
      data: receipt
    });

  } catch (error) {
    console.error('❌ Error initiating UPI payout:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while initiating payout.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
