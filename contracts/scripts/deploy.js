// deploy.js
// VeriFund Smart Contract Deployment Script
// This script deploys the VeriFundSplitter contract with dynamic arguments from command line

const { ethers } = require("hardhat");

/**
 * Parse command-line arguments
 * Expected format: --owner <address> --payees <addr1,addr2> --shares <share1,share2> --cap <amount>
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      params[key] = value;
      i++; // Skip next item as it's the value
    }
  }
  
  return params;
}

/**
 * Main deployment function
 * Deploys VeriFundSplitter contract with dynamic parameters
 */
async function main() {
  try {
    // Parse command-line arguments
    const params = parseArguments();
    
    // Validate required parameters
    if (!params.owner || !params.payees || !params.shares || !params.cap) {
      console.error('Missing required parameters. Usage:');
      console.error('npx hardhat run scripts/deploy.js --network sepolia --owner <address> --payees <addr1,addr2> --shares <share1,share2> --cap <amount>');
      process.exit(1);
    }
    
    // Parse parameters
    const initialOwner = params.owner;
    const payeeAddresses = params.payees.split(',').map(addr => addr.trim());
    const payeeShares = params.shares.split(',').map(share => parseInt(share.trim()));
    const repaymentCapEth = params.cap;
    
    // Validate inputs
    if (payeeAddresses.length !== payeeShares.length) {
      console.error('Error: Number of payees must match number of shares');
      process.exit(1);
    }
    
    if (payeeAddresses.length === 0) {
      console.error('Error: At least one payee is required');
      process.exit(1);
    }
    
    // Validate Ethereum addresses
    if (!ethers.isAddress(initialOwner)) {
      console.error('Error: Invalid owner address');
      process.exit(1);
    }
    
    for (const addr of payeeAddresses) {
      if (!ethers.isAddress(addr)) {
        console.error(`Error: Invalid payee address: ${addr}`);
        process.exit(1);
      }
    }
    
    // Convert repayment cap from ETH to wei
    const repaymentCapWei = ethers.parseEther(repaymentCapEth);
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    
    // Deploy VeriFundSplitter
    const Splitter = await ethers.getContractFactory("VeriFundSplitter");
    const splitter = await Splitter.deploy(
      initialOwner,
      payeeAddresses,
      payeeShares,
      repaymentCapWei
    );
    
    // Wait for deployment
    await splitter.waitForDeployment();
    
    // Get contract address
    const splitterAddress = await splitter.getAddress();
    
    // Output ONLY the contract address for backend to capture
    console.log(splitterAddress);
    
    return splitterAddress;

  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// ============================================================
// SCRIPT EXECUTION
// ============================================================

// Execute the main function and handle results
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
