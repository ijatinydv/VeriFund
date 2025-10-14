# Web3 Integration Testing Guide

## Quick Test Checklist

This guide walks you through testing the complete Web3 integration for automatic smart contract deployment.

---

## Prerequisites

### 1. Environment Setup

**Backend `.env`** (in `backend/` folder):
```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/verifund

# JWT
JWT_SECRET=your-secret-key-here

# Blockchain - Sepolia Testnet
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
OWNER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Optional: Contract addresses
CONSENT_REGISTRY_ADDRESS=0x...
```

**Contracts `.env`** (in `contracts/` folder):
```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

### 2. Get Test ETH

The deployer wallet needs Sepolia ETH for gas fees:

1. Visit: https://sepoliafaucet.com/
2. Enter your wallet address
3. Request test ETH
4. Wait for confirmation (~30 seconds)

Check balance:
```bash
cd backend
node -e "const web3 = require('./src/services/web3.service'); web3.getWalletBalance().then(console.log)"
```

Expected output: `0.5` (or similar ETH amount)

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Contracts
cd ../contracts
npm install
```

### 4. Compile Contracts

```bash
cd contracts
npm run compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

---

## Test 1: Deployment Script (Standalone)

Test the deployment script directly before integrating with backend.

### Step 1: Create Test Wallet Addresses

```javascript
// In Node.js REPL or test file
const { ethers } = require('ethers');

// Generate 3 test investor addresses
const investor1 = ethers.Wallet.createRandom();
const investor2 = ethers.Wallet.createRandom();
const investor3 = ethers.Wallet.createRandom();

console.log('Investor 1:', investor1.address);
console.log('Investor 2:', investor2.address);
console.log('Investor 3:', investor3.address);
```

### Step 2: Run Deployment Script

```bash
cd contracts

npx hardhat run scripts/deploy.js --network sepolia \
  --owner 0xYOUR_WALLET_ADDRESS \
  --payees 0xINVESTOR1,0xINVESTOR2,0xINVESTOR3 \
  --shares 5000,3000,2000 \
  --cap 0.5
```

**Expected Output**: Single line with contract address
```
0x1234567890123456789012345678901234567890
```

### Step 3: Verify on Etherscan

Visit: `https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]`

Check:
- ✅ Contract exists
- ✅ Balance is 0 ETH initially
- ✅ Contract code is deployed

---

## Test 2: End-to-End Investment Flow

Test the complete integration from investment to deployment.

### Prerequisites

1. **Start MongoDB**:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   
   Expected output:
   ```
   Server running on port 3000
   MongoDB connected successfully
   ✅ Web3 Service initialized with wallet: 0x...
   ```

3. **Start Frontend** (optional):
   ```bash
   cd frontend
   npm run dev
   ```

### Test Flow

#### 1. Register Users

**Creator Account**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xCREATOR_WALLET",
    "name": "Alice Creator",
    "email": "alice@example.com",
    "password": "password123",
    "role": "Creator"
  }'
```

Save the returned `token`.

**Investor Accounts** (create 2-3):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xINVESTOR1_WALLET",
    "name": "Bob Investor",
    "email": "bob@example.com",
    "password": "password123",
    "role": "Investor"
  }'
```

#### 2. Create Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [CREATOR_TOKEN]" \
  -d '{
    "title": "Revolutionary AI Startup",
    "description": "Building the next generation of AI tools",
    "category": "Technology",
    "fundingGoalInr": 100000,
    "revenueSharePercent": 15,
    "fundingDeadline": "2025-12-31"
  }'
```

Save the returned `projectId`.

#### 3. Make First Investment (Below Goal)

```bash
curl -X POST http://localhost:3000/api/investments/[PROJECT_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [INVESTOR1_TOKEN]" \
  -d '{
    "amount": 40000
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Investment successful",
  "investment": { ... },
  "project": {
    "currentFundingInr": 40000,
    "fundingGoalInr": 100000,
    "status": "Funding"
  },
  "splitterDeployed": false,
  "fundingProgress": 40
}
```

#### 4. Make Second Investment (Reaches Goal)

```bash
curl -X POST http://localhost:3000/api/investments/[PROJECT_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [INVESTOR2_TOKEN]" \
  -d '{
    "amount": 60000
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Investment successful! Funding goal reached and splitter contract deployed.",
  "investment": { ... },
  "project": {
    "currentFundingInr": 100000,
    "fundingGoalInr": 100000,
    "status": "Live",
    "splitterContractAddress": "0x..."
  },
  "splitterDeployed": true,
  "splitterAddress": "0x..."
}
```

**Backend Console Logs** (should show):
```
Investment added to project: ₹60000 by investor 673...
Project funding: ₹100000 / ₹100000
Funding check: isFunded=true, hasNoSplitter=true
🎉 Funding goal reached! Deploying splitter contract...

🚀 Starting smart contract deployment for project: Revolutionary AI Startup
📊 Total investments: 2
💰 Total raised: ₹100000
👥 Unique investors: 2
📈 Shares (basis points): [ 4000, 6000 ]
✓ Shares sum: 10000 (must be 10000)
🎯 Repayment cap: ₹120000 (~0.6000 ETH)

📝 Executing deployment command...
   Owner: 0xCREATOR_WALLET
   Payees: 2
   Network: Sepolia

✅ Contract deployed successfully!
📍 Contract address: 0x...
🔗 View on Etherscan: https://sepolia.etherscan.io/address/0x...
```

#### 5. Verify Deployment

**Check Database**:
```bash
# MongoDB shell
use verifund
db.projects.findOne({ _id: ObjectId("PROJECT_ID") })
```

Should show:
```json
{
  "status": "Live",
  "splitterContractAddress": "0x...",
  "currentFundingInr": 100000
}
```

**Check Etherscan**:
Visit the Etherscan link from the logs.

Verify:
- ✅ Contract deployed
- ✅ Constructor args: 2 payees with correct shares
- ✅ Owner is creator's wallet
- ✅ Repayment cap is set

---

## Test 3: Revenue Payout Simulation

Test that the deployed contract can receive and distribute funds.

### Step 1: Get Contract Address

```bash
curl http://localhost:3000/api/projects/[PROJECT_ID]
```

Extract `splitterContractAddress`.

### Step 2: Simulate Payout

Create a test script `test-payout.js`:

```javascript
const web3Service = require('./backend/src/services/web3.service');

async function testPayout() {
  try {
    const contractAddress = '0xYOUR_SPLITTER_ADDRESS';
    const amountEth = '0.1'; // Send 0.1 ETH
    
    console.log('Sending test payout...');
    const result = await web3Service.simulatePayout(contractAddress, amountEth);
    
    console.log('Success!');
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Block Number:', result.blockNumber);
    console.log('Explorer:', result.explorerUrl);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPayout();
```

Run:
```bash
node test-payout.js
```

**Expected Output**:
```
💸 Simulating payout to contract: 0x...
💰 Amount: 0.1 ETH
💳 Wallet balance: 0.5000 ETH
📤 Transaction sent: 0x...
⏳ Waiting for confirmation...
✅ Transaction confirmed in block 5123456
⛽ Gas used: 21000
🔗 View on Etherscan: https://sepolia.etherscan.io/tx/0x...
```

### Step 3: Verify Investor Can Withdraw

Check the contract on Etherscan:
1. Go to contract address on Sepolia Etherscan
2. Click "Contract" → "Write Contract"
3. Connect investor wallet (MetaMask)
4. Call `release(investorAddress)`
5. Confirm transaction

Investor should receive their proportional share!

---

## Test 4: Error Handling

### Test: Investment Without Wallet Address

Create user without wallet:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid User",
    "email": "invalid@example.com",
    "password": "password123",
    "role": "Investor"
  }'
```

Try to invest:
```bash
curl -X POST http://localhost:3000/api/investments/[PROJECT_ID] \
  -H "Authorization: Bearer [INVALID_USER_TOKEN]" \
  -d '{ "amount": 10000 }'
```

**Expected**: Error when trying to deploy (deployment will fail gracefully)

### Test: Insufficient Deployer Balance

Temporarily use a wallet with 0 ETH in `.env`.

Make investment that triggers deployment.

**Expected**:
```json
{
  "success": true,
  "message": "Investment successful, but splitter deployment failed. Manual deployment required.",
  "splitterDeployed": false,
  "error": "Insufficient funds in deployer wallet..."
}
```

Investment is still recorded, but status stays "Funding".

---

## Test 5: Manual Deployment

Test the manual deployment endpoint for recovery scenarios.

### Setup: Create Funded Project Without Deployment

Simulate a deployment failure scenario by temporarily breaking the deployment (e.g., wrong RPC URL).

### Trigger Manual Deployment

```bash
curl -X POST http://localhost:3000/api/investments/deploy-splitter/[PROJECT_ID] \
  -H "Authorization: Bearer [CREATOR_TOKEN]"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Splitter contract deployed successfully",
  "contractAddress": "0x...",
  "project": {
    "status": "Live",
    "splitterContractAddress": "0x..."
  }
}
```

---

## Common Issues & Solutions

### Issue: "Module not found: ethers"

**Solution**:
```bash
cd backend
npm install ethers
```

### Issue: "Cannot read property 'walletAddress' of undefined"

**Cause**: User object not populated with wallet address.

**Solution**: Ensure user registration includes `walletAddress` field.

### Issue: "Deployment script returned invalid address"

**Cause**: Hardhat script has extra console.log statements.

**Solution**: Check `contracts/scripts/deploy.js` - only `console.log(splitterAddress)` should output to stdout.

### Issue: "Transaction timeout"

**Cause**: Sepolia network congestion.

**Solution**: 
- Wait and retry
- Increase timeout in `web3.service.js` (line with `timeout: 120000`)
- Check Sepolia network status

### Issue: "Shares don't sum to 10000"

**This should never happen** - the code automatically corrects rounding errors.

If it does, check the adjustment logic in `web3.service.js`.

---

## Automated Test Script

Create `test-integration.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Web3 Integration Test..."

# 1. Start MongoDB
echo "Starting MongoDB..."
sudo systemctl start mongod
sleep 2

# 2. Start Backend
echo "Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!
sleep 5

# 3. Register Creator
echo "Registering Creator..."
CREATOR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "name": "Test Creator",
    "email": "creator@test.com",
    "password": "test123",
    "role": "Creator"
  }')

CREATOR_TOKEN=$(echo $CREATOR_RESPONSE | jq -r '.token')
echo "Creator Token: $CREATOR_TOKEN"

# 4. Create Project
echo "Creating Project..."
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -d '{
    "title": "Test Project",
    "fundingGoalInr": 100000,
    "revenueSharePercent": 10
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data._id')
echo "Project ID: $PROJECT_ID"

# 5. Register Investors
echo "Registering Investors..."
INVESTOR1_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x2222222222222222222222222222222222222222",
    "name": "Investor 1",
    "email": "inv1@test.com",
    "password": "test123",
    "role": "Investor"
  }')

INVESTOR1_TOKEN=$(echo $INVESTOR1_RESPONSE | jq -r '.token')

INVESTOR2_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x3333333333333333333333333333333333333333",
    "name": "Investor 2",
    "email": "inv2@test.com",
    "password": "test123",
    "role": "Investor"
  }')

INVESTOR2_TOKEN=$(echo $INVESTOR2_RESPONSE | jq -r '.token')

# 6. Make Investments
echo "Making Investment 1..."
curl -s -X POST http://localhost:3000/api/investments/$PROJECT_ID \
  -H "Authorization: Bearer $INVESTOR1_TOKEN" \
  -d '{ "amount": 60000 }'

echo "Making Investment 2 (triggers deployment)..."
FINAL_RESPONSE=$(curl -s -X POST http://localhost:3000/api/investments/$PROJECT_ID \
  -H "Authorization: Bearer $INVESTOR2_TOKEN" \
  -d '{ "amount": 40000 }')

echo "$FINAL_RESPONSE" | jq '.'

DEPLOYED=$(echo $FINAL_RESPONSE | jq -r '.splitterDeployed')
CONTRACT_ADDRESS=$(echo $FINAL_RESPONSE | jq -r '.splitterAddress')

if [ "$DEPLOYED" == "true" ]; then
  echo -e "${GREEN}✅ Test Passed! Contract deployed at: $CONTRACT_ADDRESS${NC}"
  echo "View on Etherscan: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
else
  echo -e "${RED}❌ Test Failed! Deployment did not occur.${NC}"
fi

# Cleanup
kill $BACKEND_PID
```

Make executable and run:
```bash
chmod +x test-integration.sh
./test-integration.sh
```

---

## Success Criteria

✅ **All tests should pass if:**

1. Deployment script outputs contract address when run standalone
2. Backend connects to Web3 service on startup
3. Investment creates records in database
4. Funding goal triggers automatic deployment
5. Contract address is saved to project document
6. Project status changes to "Live"
7. Contract is visible on Sepolia Etherscan
8. Payout simulation sends ETH to contract
9. Investors can withdraw their share

---

**Testing Complete!** 🎉

Your Web3 integration is working correctly when all tests pass.
