// deploy.js
// VeriFund Smart Contract Deployment Script
// This script deploys all three core contracts to an EVM-compatible network (e.g., Sepolia, Polygon Mumbai)

const { ethers } = require("hardhat");

// ============================================================
// PLACEHOLDER DEPLOYMENT DATA
// Replace these values with actual production data when deploying
// ============================================================

/**
 * Sample agreement hash for VeriFundSecurityToken
 * In production, this should be the Keccak256 hash of the actual legal agreement
 * You can generate this using: ethers.keccak256(ethers.toUtf8Bytes("Your agreement text"))
 */
const AGREEMENT_HASH = ethers.keccak256(ethers.toUtf8Bytes("VeriFund Project Alpha Investment Agreement v1.0"));

/**
 * Sample investor addresses for VeriFundSplitter
 * In production, replace with actual whitelisted investor addresses
 */
const INVESTOR_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const INVESTOR_2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

/**
 * Array of investor addresses (payees)
 * Must correspond 1:1 with the shares array below
 */
const PAYEE_ADDRESSES = [INVESTOR_1, INVESTOR_2];

/**
 * Array of investor shares in basis points (10000 = 100%)
 * Example: [5000, 5000] = 50% each
 * Example: [7000, 3000] = 70% and 30%
 */
const PAYEE_SHARES = [5000, 5000]; // 50% each

/**
 * Maximum total ETH that can be distributed to investors (repayment cap)
 * Example: "10.0" = 10 ETH maximum distribution
 * This value is in ETH and will be converted to wei
 */
const REPAYMENT_CAP_ETH = "10.0";

/**
 * Token metadata for VeriFundSecurityToken
 */
const TOKEN_NAME = "VeriFund Project Alpha";
const TOKEN_SYMBOL = "VFPA";

// ============================================================
// DEPLOYMENT LOGIC
// ============================================================

/**
 * Main deployment function
 * Deploys all three VeriFund contracts in sequence and logs their addresses
 */
async function main() {
  try {
    // Get the deployer account from Hardhat's configured accounts
    const [deployer] = await ethers.getSigners();
    
    console.log("====================================================");
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("====================================================\n");

    // Convert repayment cap from ETH to wei
    const repaymentCapWei = ethers.parseEther(REPAYMENT_CAP_ETH);

    // --------------------------------------------------------
    // 1. Deploy VeriFundConsentRegistry
    // --------------------------------------------------------
    console.log("Deploying VeriFundConsentRegistry...");
    
    const ConsentRegistry = await ethers.getContractFactory("VeriFundConsentRegistry");
    const consentRegistry = await ConsentRegistry.deploy(deployer.address);
    
    // Wait for deployment to be confirmed on-chain
    await consentRegistry.waitForDeployment();
    
    const consentRegistryAddress = await consentRegistry.getAddress();
    console.log("✅ VeriFundConsentRegistry deployed to:", consentRegistryAddress);
    console.log("----------------------------------------------------\n");

    // --------------------------------------------------------
    // 2. Deploy VeriFundSecurityToken
    // --------------------------------------------------------
    console.log("Deploying VeriFundSecurityToken...");
    console.log("   Token Name:", TOKEN_NAME);
    console.log("   Token Symbol:", TOKEN_SYMBOL);
    console.log("   Agreement Hash:", AGREEMENT_HASH);
    
    const SecurityToken = await ethers.getContractFactory("VeriFundSecurityToken");
    const securityToken = await SecurityToken.deploy(
      deployer.address,      // initialOwner
      AGREEMENT_HASH,        // agreementHash
      TOKEN_NAME,            // name
      TOKEN_SYMBOL           // symbol
    );
    
    await securityToken.waitForDeployment();
    
    const securityTokenAddress = await securityToken.getAddress();
    console.log("✅ VeriFundSecurityToken deployed to:", securityTokenAddress);
    console.log("----------------------------------------------------\n");

    // --------------------------------------------------------
    // 3. Deploy VeriFundSplitter
    // --------------------------------------------------------
    console.log("Deploying VeriFundSplitter...");
    console.log("   Payees:", PAYEE_ADDRESSES.length);
    console.log("   Repayment Cap:", REPAYMENT_CAP_ETH, "ETH");
    
    // Validate that payees and shares arrays have matching lengths
    if (PAYEE_ADDRESSES.length !== PAYEE_SHARES.length) {
      throw new Error("Payee addresses and shares arrays must have the same length");
    }
    
    const Splitter = await ethers.getContractFactory("VeriFundSplitter");
    const splitter = await Splitter.deploy(
      deployer.address,      // initialOwner
      PAYEE_ADDRESSES,       // payees array
      PAYEE_SHARES,          // shares array
      repaymentCapWei        // repaymentCap in wei
    );
    
    await splitter.waitForDeployment();
    
    const splitterAddress = await splitter.getAddress();
    console.log("✅ VeriFundSplitter deployed to:", splitterAddress);
    console.log("----------------------------------------------------\n");

    // --------------------------------------------------------
    // Deployment Summary
    // --------------------------------------------------------
    console.log("====================================================");
    console.log("🎉 Deployment complete!");
    console.log("====================================================");
    console.log("\nDeployed Contract Addresses:");
    console.log("┌─────────────────────────────────────────────────┐");
    console.log("│ VeriFundConsentRegistry:                        │");
    console.log("│", consentRegistryAddress.padEnd(48), "│");
    console.log("├─────────────────────────────────────────────────┤");
    console.log("│ VeriFundSecurityToken:                          │");
    console.log("│", securityTokenAddress.padEnd(48), "│");
    console.log("├─────────────────────────────────────────────────┤");
    console.log("│ VeriFundSplitter:                               │");
    console.log("│", splitterAddress.padEnd(48), "│");
    console.log("└─────────────────────────────────────────────────┘");
    console.log("\n💡 Save these addresses for your backend integration!\n");

    // Return addresses for potential further use in scripts
    return {
      consentRegistry: consentRegistryAddress,
      securityToken: securityTokenAddress,
      splitter: splitterAddress
    };

  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);
    
    // Log full error details for debugging
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    
    // Exit with error code
    process.exit(1);
  }
}

// ============================================================
// SCRIPT EXECUTION
// ============================================================

// Execute the main function and handle results
main()
  .then(() => {
    console.log("Script execution completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error in main execution:");
    console.error(error);
    process.exit(1);
  });
