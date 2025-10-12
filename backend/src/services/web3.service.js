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
}

module.exports = new Web3Service();
