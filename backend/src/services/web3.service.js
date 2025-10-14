const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Web3 Service
 * Interacts with Ethereum smart contracts on Sepolia testnet
 */
class Web3Service {
  constructor() {
    // Network configuration
    this.networkConfig = {
      name: 'sepolia',
      chainId: 11155111,
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY
    };

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl, {
      chainId: this.networkConfig.chainId,
      name: this.networkConfig.name
    });

    // Initialize wallet (server's wallet as contract owner)
    if (!process.env.OWNER_PRIVATE_KEY) {
      console.warn('⚠️  OWNER_PRIVATE_KEY not set. Blockchain operations will fail.');
    } else {
      this.wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, this.provider);
      console.log(`✅ Web3 Service initialized with wallet: ${this.wallet.address}`);
    }

    // Load contract addresses
    this.contractAddresses = {
      consentRegistry: process.env.CONSENT_REGISTRY_ADDRESS,
      securityTokenFactory: process.env.SECURITY_TOKEN_FACTORY_ADDRESS
    };

    // Load ABIs
    this.abis = this._loadABIs();

    // Initialize contract instances
    this._initializeContracts();
  }

  /**
   * Load contract ABIs from files
   * @private
   */
  _loadABIs() {
    try {
      const abiDir = path.join(__dirname, '../../contracts/abis');
      
      return {
        consentRegistry: this._loadABI(abiDir, 'VeriFundConsentRegistry.json'),
        securityToken: this._loadABI(abiDir, 'VeriFundSecurityToken.json'),
        splitter: this._loadABI(abiDir, 'VeriFundSplitter.json')
      };
    } catch (error) {
      console.error('Error loading ABIs:', error);
      return {};
    }
  }

  /**
   * Load single ABI file
   * @private
   */
  _loadABI(directory, filename) {
    try {
      const filepath = path.join(directory, filename);
      if (fs.existsSync(filepath)) {
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        return content.abi || content; // Handle both formats
      }
      console.warn(`⚠️  ABI file not found: ${filename}`);
      return null;
    } catch (error) {
      console.error(`Error loading ABI ${filename}:`, error);
      return null;
    }
  }

  /**
   * Initialize contract instances
   * @private
   */
  _initializeContracts() {
    try {
      if (this.wallet && this.contractAddresses.consentRegistry && this.abis.consentRegistry) {
        this.consentRegistryContract = new ethers.Contract(
          this.contractAddresses.consentRegistry,
          this.abis.consentRegistry,
          this.wallet
        );
        console.log('✅ Consent Registry contract initialized');
      }
    } catch (error) {
      console.error('Error initializing contracts:', error);
    }
  }

  /**
   * Log user consent on blockchain
   * @param {string} userAddress - User's Ethereum address
   * @param {string} consentType - Type of consent (e.g., 'KYC', 'TERMS')
   * @param {string} documentHash - IPFS hash or document identifier
   * @returns {Promise<Object>} - Transaction receipt
   */
  async logConsent(userAddress, consentType, documentHash) {
    try {
      if (!this.consentRegistryContract) {
        throw new Error('Consent Registry contract not initialized');
      }

      // Validate inputs
      if (!ethers.isAddress(userAddress)) {
        throw new Error('Invalid user address');
      }

      console.log(`Logging consent for ${userAddress}, type: ${consentType}`);

      // Call contract method
      const tx = await this.consentRegistryContract.logConsent(
        userAddress,
        consentType,
        documentHash
      );

      console.log(`Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log(`Consent logged successfully in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Log consent error:', error);
      throw new Error(`Failed to log consent: ${error.message}`);
    }
  }

  /**
   * Mint security token (NFT) for investor
   * @param {string} tokenContractAddress - Security token contract address
   * @param {string} investorAddress - Investor's Ethereum address
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} - Transaction receipt with token ID
   */
  async mintToken(tokenContractAddress, investorAddress, projectId) {
    try {
      // Validate inputs
      if (!ethers.isAddress(tokenContractAddress) || !ethers.isAddress(investorAddress)) {
        throw new Error('Invalid contract or investor address');
      }

      if (!this.abis.securityToken) {
        throw new Error('Security Token ABI not loaded');
      }

      // Create contract instance
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        this.abis.securityToken,
        this.wallet
      );

      console.log(`Minting token for ${investorAddress} on contract ${tokenContractAddress}`);

      // Call safeMint function
      const tx = await tokenContract.safeMint(investorAddress, projectId);

      console.log(`Mint transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Extract token ID from event logs
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = tokenContract.interface.parseLog(log);
          return parsed && parsed.name === 'Transfer';
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = tokenContract.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId?.toString();
      }

      console.log(`Token minted successfully. Token ID: ${tokenId}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        tokenId: tokenId,
        contractAddress: tokenContractAddress,
        investorAddress: investorAddress,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('Mint token error:', error);
      throw new Error(`Failed to mint token: ${error.message}`);
    }
  }

  /**
   * Deploy a new Revenue Splitter contract
   * @param {Array<string>} investors - Array of investor addresses
   * @param {Array<number>} shares - Array of share percentages (must sum to 100)
   * @param {number} fundingCap - Maximum funding amount in Wei
   * @returns {Promise<Object>} - Deployed contract address and details
   */
  async deploySplitterContract(investors, shares, fundingCap) {
    try {
      // Validate inputs
      if (!Array.isArray(investors) || !Array.isArray(shares)) {
        throw new Error('Investors and shares must be arrays');
      }

      if (investors.length !== shares.length) {
        throw new Error('Investors and shares arrays must have same length');
      }

      if (investors.length === 0) {
        throw new Error('At least one investor required');
      }

      // Validate addresses
      for (const address of investors) {
        if (!ethers.isAddress(address)) {
          throw new Error(`Invalid investor address: ${address}`);
        }
      }

      // Validate shares sum to 100
      const totalShares = shares.reduce((sum, share) => sum + share, 0);
      if (totalShares !== 100) {
        throw new Error(`Shares must sum to 100, got ${totalShares}`);
      }

      if (!this.abis.splitter) {
        throw new Error('Splitter ABI not loaded');
      }

      // Load bytecode
      const bytecode = this._loadSplitterBytecode();

      console.log('Deploying Revenue Splitter contract...');
      console.log('Investors:', investors);
      console.log('Shares:', shares);
      console.log('Funding Cap:', fundingCap);

      // Create contract factory
      const factory = new ethers.ContractFactory(
        this.abis.splitter,
        bytecode,
        this.wallet
      );

      // Deploy contract with constructor arguments
      const contract = await factory.deploy(investors, shares, fundingCap);

      console.log(`Deployment transaction sent: ${contract.deploymentTransaction().hash}`);

      // Wait for deployment
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();

      console.log(`✅ Splitter contract deployed at: ${contractAddress}`);

      return {
        success: true,
        contractAddress: contractAddress,
        transactionHash: contract.deploymentTransaction().hash,
        investors: investors,
        shares: shares,
        fundingCap: fundingCap,
        deployer: this.wallet.address,
        network: this.networkConfig.name
      };

    } catch (error) {
      console.error('Deploy splitter contract error:', error);
      throw new Error(`Failed to deploy splitter contract: ${error.message}`);
    }
  }

  /**
   * Load splitter contract bytecode
   * @private
   */
  _loadSplitterBytecode() {
    try {
      const bytecodeDir = path.join(__dirname, '../../contracts/bytecode');
      const filepath = path.join(bytecodeDir, 'VeriFundSplitter.json');
      
      if (fs.existsSync(filepath)) {
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        return content.bytecode || content.data?.bytecode?.object;
      }

      throw new Error('Splitter bytecode file not found');
    } catch (error) {
      throw new Error(`Failed to load bytecode: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   * @returns {Promise<string>} - Balance in ETH
   */
  async getWalletBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get current gas price
   * @returns {Promise<string>} - Gas price in Gwei
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        throw new Error('Transaction not found');
      }

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'success' : 'failed',
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to
      };

    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  /**
   * Deploy a VeriFundSplitter contract for a funded project
   * Executes the Hardhat deployment script with dynamic parameters
   * @param {Object} project - The project document
   * @param {Array} investments - Array of investment documents
   * @returns {Promise<string>} - Deployed contract address
   */
  async deploySplitterContract(project, investments) {
    const { exec } = require('child_process');
    const path = require('path');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
      console.log(`\n🚀 Starting smart contract deployment for project: ${project.title}`);
      console.log(`📊 Total investments: ${investments.length}`);
      console.log(`💰 Total raised: ₹${project.currentFundingInr}`);

      // Validate inputs
      if (!project.creator || !project.creator.walletAddress) {
        throw new Error('Project creator wallet address not found');
      }

      if (!investments || investments.length === 0) {
        throw new Error('No investments found for this project');
      }

      // Prepare constructor arguments
      const initialOwner = project.creator.walletAddress;
      
      // Get unique investors with their wallet addresses
      const payees = [];
      const investmentAmounts = [];
      
      // Group investments by investor
      const investorMap = new Map();
      for (const investment of investments) {
        if (!investment.investor || !investment.investor.walletAddress) {
          console.warn(`⚠️  Skipping investment without wallet address`);
          continue;
        }
        
        const walletAddress = investment.investor.walletAddress.toLowerCase();
        if (investorMap.has(walletAddress)) {
          investorMap.set(walletAddress, investorMap.get(walletAddress) + investment.amountInr);
        } else {
          investorMap.set(walletAddress, investment.amountInr);
        }
      }

      // Convert map to arrays
      for (const [wallet, amount] of investorMap.entries()) {
        payees.push(wallet);
        investmentAmounts.push(amount);
      }

      if (payees.length === 0) {
        throw new Error('No valid investor wallet addresses found');
      }

      console.log(`👥 Unique investors: ${payees.length}`);

      // Calculate shares in basis points (10000 = 100%)
      const totalInvested = investmentAmounts.reduce((sum, amt) => sum + amt, 0);
      const shares = investmentAmounts.map(amount => {
        return Math.round((amount / totalInvested) * 10000);
      });

      // Ensure shares sum to exactly 10000 by adjusting the largest share if needed
      const sharesSum = shares.reduce((sum, share) => sum + share, 0);
      if (sharesSum !== 10000) {
        const diff = 10000 - sharesSum;
        const maxIndex = shares.indexOf(Math.max(...shares));
        shares[maxIndex] += diff;
      }

      console.log(`📈 Shares (basis points):`, shares);
      console.log(`✓ Shares sum: ${shares.reduce((s, n) => s + n, 0)} (must be 10000)`);

      // Calculate repayment cap (e.g., 120% of funding goal)
      // Convert INR to ETH using a reasonable exchange rate
      // For testnet, we'll use a simplified conversion: 1 ETH = 200,000 INR
      const INR_TO_ETH_RATE = 200000;
      const repaymentCapInr = project.fundingGoalInr * 1.2; // 120% return cap
      const repaymentCapEth = (repaymentCapInr / INR_TO_ETH_RATE).toFixed(4);

      console.log(`🎯 Repayment cap: ₹${repaymentCapInr} (~${repaymentCapEth} ETH)`);

      // Prepare command-line arguments
      const payeesStr = payees.join(',');
      const sharesStr = shares.join(',');

      // Construct the Hardhat command
      const contractsDir = path.resolve(__dirname, '../../../contracts');
      const command = `cd "${contractsDir}" && npx hardhat run scripts/deploy.js --network sepolia --owner ${initialOwner} --payees ${payeesStr} --shares ${sharesStr} --cap ${repaymentCapEth}`;

      console.log(`\n📝 Executing deployment command...`);
      console.log(`   Owner: ${initialOwner}`);
      console.log(`   Payees: ${payees.length}`);
      console.log(`   Network: Sepolia`);

      // Execute the deployment script
      const { stdout, stderr } = await execPromise(command, {
        timeout: 120000, // 2 minute timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      // Log any warnings or errors
      if (stderr && stderr.trim()) {
        console.log(`⚠️  Deployment warnings:`, stderr);
      }

      // Extract contract address from stdout
      // The deploy script outputs only the contract address
      const contractAddress = stdout.trim().split('\n').pop();

      // Validate contract address format
      if (!contractAddress || !ethers.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address returned: ${contractAddress}`);
      }

      console.log(`✅ Contract deployed successfully!`);
      console.log(`📍 Contract address: ${contractAddress}`);
      console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}\n`);

      return contractAddress;

    } catch (error) {
      console.error('❌ Deploy splitter contract error:', error);
      
      // Provide more context on specific errors
      if (error.message.includes('timeout')) {
        throw new Error('Contract deployment timed out. Please check network status and try again.');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds in deployer wallet. Please add ETH to the deployment wallet.');
      } else {
        throw new Error(`Failed to deploy splitter contract: ${error.message}`);
      }
    }
  }

  /**
   * Simulate a payout by sending ETH to a deployed contract
   * Used for testing the revenue distribution mechanism
   * @param {string} contractAddress - The splitter contract address
   * @param {string} amountEth - Amount of ETH to send (as string)
   * @returns {Promise<Object>} - Transaction details
   */
  async simulatePayout(contractAddress, amountEth) {
    try {
      console.log(`\n💸 Simulating payout to contract: ${contractAddress}`);
      console.log(`💰 Amount: ${amountEth} ETH`);

      // Validate contract address
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      // Validate amount
      const amount = parseFloat(amountEth);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount. Must be a positive number.');
      }

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceEth = parseFloat(ethers.formatEther(balance));
      
      console.log(`💳 Wallet balance: ${balanceEth.toFixed(4)} ETH`);

      if (balanceEth < amount) {
        throw new Error(`Insufficient balance. Have ${balanceEth.toFixed(4)} ETH, need ${amount} ETH`);
      }

      // Prepare transaction
      const amountWei = ethers.parseEther(amountEth);
      
      const tx = await this.wallet.sendTransaction({
        to: contractAddress,
        value: amountWei,
        // Let ethers estimate gas automatically
      });

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${receipt.hash}\n`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amountSent: amountEth,
        contractAddress: contractAddress,
        from: this.wallet.address,
        network: this.networkConfig.name,
        explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`
      };

    } catch (error) {
      console.error('❌ Simulate payout error:', error);
      throw new Error(`Failed to simulate payout: ${error.message}`);
    }
  }
}

module.exports = new Web3Service();
