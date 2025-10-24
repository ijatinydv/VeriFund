// ============================================================
// VERIFUND HARDHAT CONFIGURATION
// ============================================================
// This configuration file sets up Hardhat for VeriFund smart
// contract development, testing, and deployment to Sepolia.
// ============================================================

require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("dotenv").config();

// Load environment variables with validation
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

// Use a dummy private key if none is set (for compilation/testing only)
const DUMMY_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000001";
const sepoliaPrivateKey = PRIVATE_KEY && PRIVATE_KEY.length === 64 ? PRIVATE_KEY : DUMMY_PRIVATE_KEY;
const mainnetPrivateKey = MAINNET_PRIVATE_KEY && MAINNET_PRIVATE_KEY.length === 64 ? MAINNET_PRIVATE_KEY : DUMMY_PRIVATE_KEY;

// Validate critical environment variables for deployment
if ((!PRIVATE_KEY || PRIVATE_KEY.length !== 64) && process.argv.includes("--network") && process.argv.includes("sepolia")) {
  console.warn("⚠️  WARNING: PRIVATE_KEY not set or invalid in .env file");
  console.warn("   Deployments to Sepolia will fail. Set a valid 64-character private key.");
  console.warn("   Using dummy key for compilation only.");
}

if (!SEPOLIA_RPC_URL && process.argv.includes("sepolia")) {
  console.error("❌ ERROR: SEPOLIA_RPC_URL not set in .env file");
  console.error("   Get a free RPC URL from Alchemy, Infura, or QuickNode");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // ============================================================
  // Solidity Compiler Configuration
  // ============================================================
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for deployment cost vs. execution cost
      },
      // Optional: Add specific EVM version if needed
      // evmVersion: "paris",
    },
  },

  // ============================================================
  // Network Configuration
  // ============================================================
  networks: {
    // ------------------------------------------------------------
    // Local Hardhat Network (for development and testing)
    // ------------------------------------------------------------
    hardhat: {
      chainId: 31337,
      // Uncomment to fork mainnet for testing
      // forking: {
      //   url: MAINNET_RPC_URL || "",
      //   blockNumber: 18000000, // Optional: pin to specific block
      // },
    },

    // ------------------------------------------------------------
    // Localhost Network (for local node testing)
    // ------------------------------------------------------------
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ------------------------------------------------------------
    // Sepolia Testnet (recommended for testing)
    // ------------------------------------------------------------
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      // Gas configuration for Sepolia
      gas: "auto",
      gasPrice: "auto",
      // Timeout for waiting for transactions
      timeout: 120000, // 2 minutes
      // Optional: Set gas limits to prevent accidental overspending
      // gasPrice: 50000000000, // 50 gwei
    },

    // ------------------------------------------------------------
    // Ethereum Mainnet (for production deployment)
    // ------------------------------------------------------------
    mainnet: {
      url: MAINNET_RPC_URL || "",
      accounts: [mainnetPrivateKey],
      chainId: 1,
      gas: "auto",
      gasPrice: "auto",
      timeout: 180000, // 3 minutes
      // CRITICAL: Set conservative gas limits for mainnet
      // Uncomment and adjust based on network conditions
      // gasPrice: 30000000000, // 30 gwei
    },
  },

  // ============================================================
  // Etherscan Verification Configuration
  // ============================================================
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
      mainnet: ETHERSCAN_API_KEY || "",
    },
    // Customize verification URLs if needed
    // customChains: []
  },

  // ============================================================
  // Gas Reporter Configuration (for test optimization)
  // ============================================================
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    // Get free API key from https://coinmarketcap.com/api/
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
    // Specify which methods to track
    // excludeContracts: [],
    // src: "./contracts",
  },

  // ============================================================
  // Path Configuration
  // ============================================================
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  // ============================================================
  // Mocha Test Configuration
  // ============================================================
  mocha: {
    timeout: 40000, // 40 seconds for test execution
  },

  // ============================================================
  // Additional Configuration
  // ============================================================
  
  // Default network for running commands
  defaultNetwork: "hardhat",

  // Warnings configuration
  warnings: {
    "*": {
      "default": true,
      "unused-param": false, // Disable warnings for unused params
    },
  },
};
