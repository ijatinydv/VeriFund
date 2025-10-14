# Smart Contract Deployment - Testing Guide

## Quick Start Testing

### Prerequisites

1. **Sepolia ETH in Deployer Wallet**
   ```
   Get free Sepolia ETH from:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   
   Deployer Address: Check your OWNER_PRIVATE_KEY address
   ```

2. **Environment Variables**
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   OWNER_PRIVATE_KEY=0x...
   ```

3. **Test User Wallets**
   - Creator wallet (has projects)
   - Investor 1 wallet
   - Investor 2 wallet

---

## Test Scenario 1: End-to-End Deployment

### Step 1: Create a Test Project

```bash
POST http://localhost:5000/api/projects
Authorization: Bearer <creator_token>
Content-Type: application/json

{
  "title": "Blockchain Education Platform",
  "description": "A platform to teach blockchain development",
  "category": "Education",
  "fundingGoalInr": 100000,
  "revenueSharePercent": 20
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "_id": "67...",
    "title": "Blockchain Education Platform",
    "fundingGoalInr": 100000,
    "currentFundingInr": 0,
    "status": "Funding"
  }
}
```

**Save the project ID**: `PROJECT_ID = "67..."`

---

### Step 2: Make First Investment (60%)

```bash
POST http://localhost:5000/api/investments/PROJECT_ID
Authorization: Bearer <investor1_token>
Content-Type: application/json

{
  "amount": 60000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Investment successful",
  "investment": {
    "_id": "...",
    "amountInr": 60000,
    "sharePercent": 60
  },
  "project": {
    "currentFundingInr": 60000,
    "status": "Funding"
  },
  "fundingProgress": 60
}
```

**Verification:**
- ✅ Investment recorded
- ✅ Project funding updated
- ✅ Status still "Funding"
- ✅ No contract deployed yet

---

### Step 3: Make Second Investment (40% - Triggers Deployment!)

```bash
POST http://localhost:5000/api/investments/PROJECT_ID
Authorization: Bearer <investor2_token>
Content-Type: application/json

{
  "amount": 40000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Investment successful! Funding goal reached and splitter contract deployed.",
  "investment": {
    "_id": "...",
    "amountInr": 40000,
    "sharePercent": 40
  },
  "project": {
    "currentFundingInr": 100000,
    "status": "Live",
    "splitterContractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
  },
  "splitterDeployed": true,
  "splitterAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
}
```

**Verification:**
- ✅ Investment recorded
- ✅ Funding goal reached (100,000)
- ✅ Status changed to "Live"
- ✅ Contract address populated
- ✅ `splitterDeployed: true`

**Save the contract address**: `CONTRACT_ADDRESS = "0x742d..."`

---

### Step 4: Verify Contract on Etherscan

1. Go to: `https://sepolia.etherscan.io/address/CONTRACT_ADDRESS`

2. Check:
   - ✅ Contract exists
   - ✅ Created recently
   - ✅ Constructor arguments visible
   - ✅ Balance: 0 ETH (no revenue yet)

3. View Contract Details:
   - Click "Contract" tab
   - View constructor args:
     - initialOwner: Creator's wallet
     - payees: [Investor1, Investor2]
     - shares: [6000, 4000] (basis points)
     - repaymentCap: ~0.6 ETH

---

### Step 5: Simulate Revenue Payout

```bash
POST http://localhost:5000/api/projects/PROJECT_ID/simulate-payout
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": "0.1"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully sent 0.1 ETH to splitter contract",
  "data": {
    "transactionHash": "0xabcd1234...",
    "blockNumber": 5432109,
    "gasUsed": "21000",
    "amountSent": "0.1",
    "contractAddress": "0x742d35Cc...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0xabcd1234...",
    "project": {
      "id": "67...",
      "title": "Blockchain Education Platform"
    }
  }
}
```

**Verification:**
1. Click explorerUrl to see transaction
2. Check contract balance on Etherscan
   - Balance should now be: 0.1 ETH
3. View "Events" tab
   - Should see `PaymentReceived` event

---

### Step 6: Investor Withdraws Share

**Option A: Using Etherscan**

1. Go to: `https://sepolia.etherscan.io/address/CONTRACT_ADDRESS#writeContract`
2. Click "Connect to Web3"
3. Connect Investor1's wallet (MetaMask)
4. Find function: `release(address payable account)`
5. Enter: Investor1's wallet address
6. Click "Write" → Confirm in MetaMask

**Expected:**
- Transaction confirmed
- Investor1 receives: 0.06 ETH (60% of 0.1 ETH)

**Option B: Using ethers.js**

```javascript
const ethers = require('ethers');

// Contract ABI (simplified)
const abi = [
  "function release(address payable account) public",
  "function pendingPayment(address account) public view returns (uint256)"
];

// Connect to Sepolia
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(INVESTOR1_PRIVATE_KEY, provider);

// Contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

// Check pending payment
const pending = await contract.pendingPayment(INVESTOR1_ADDRESS);
console.log('Pending:', ethers.formatEther(pending), 'ETH');

// Withdraw
const tx = await contract.release(INVESTOR1_ADDRESS);
await tx.wait();
console.log('Withdrawn!');
```

---

## Test Scenario 2: Manual Deployment

### When to Use

If automatic deployment fails during investment, use manual trigger.

### Step 1: Check Project Status

```bash
GET http://localhost:5000/api/projects/PROJECT_ID
```

**Check:**
- `currentFundingInr >= fundingGoalInr` ✅
- `splitterContractAddress` is null ❌
- `status` is "Funding" or other

### Step 2: Trigger Manual Deployment

```bash
POST http://localhost:5000/api/investments/deploy-splitter/PROJECT_ID
Authorization: Bearer <admin_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Splitter contract deployed successfully",
  "contractAddress": "0x...",
  "project": {
    "_id": "...",
    "status": "Live",
    "splitterContractAddress": "0x..."
  }
}
```

---

## Test Scenario 3: Multiple Investors

### Setup

- Investor A: ₹50,000 (50%)
- Investor B: ₹30,000 (30%)
- Investor C: ₹20,000 (20%)

### Investment Sequence

```bash
# Investor A
POST /api/investments/PROJECT_ID
{ "amount": 50000 }

# Investor B
POST /api/investments/PROJECT_ID
{ "amount": 30000 }

# Investor C (triggers deployment)
POST /api/investments/PROJECT_ID
{ "amount": 20000 }
```

### Verify Shares on Etherscan

1. Go to contract address
2. Click "Read Contract"
3. Check function: `shares(address)`
   - Enter Investor A address → Returns: 5000 (50%)
   - Enter Investor B address → Returns: 3000 (30%)
   - Enter Investor C address → Returns: 2000 (20%)

### Verify Total Shares

```
totalShares() → Returns: 10000 (100%)
```

---

## Test Scenario 4: Same Investor Multiple Times

### Setup

Investor A invests twice:
- First investment: ₹40,000
- Second investment: ₹60,000

### Expected Behavior

Contract should have:
- **ONE** payee address (Investor A)
- Share: 10000 (100%)
- Total investment: ₹100,000

**Implementation handles this correctly** by grouping investments in `deploySplitterContract()`.

---

## Test Scenario 5: Error Handling

### Test 1: Insufficient Deployer Funds

**Setup:** Drain deployer wallet to < 0.01 ETH

**Expected:**
```json
{
  "success": false,
  "message": "Investment successful, but splitter deployment failed. Manual deployment required.",
  "splitterDeployed": false,
  "error": "Insufficient funds in deployer wallet..."
}
```

**Verification:**
- Investment IS recorded
- Project status remains "Funding"
- Can trigger manual deployment later

### Test 2: Invalid Network

**Setup:** Set wrong SEPOLIA_RPC_URL

**Expected:**
```json
{
  "success": false,
  "error": "Failed to deploy splitter contract: network error..."
}
```

### Test 3: Timeout

**Setup:** Network congestion

**Expected:**
```json
{
  "success": false,
  "error": "Contract deployment timed out. Please check network status..."
}
```

---

## Monitoring & Debugging

### Backend Logs

Watch backend console for detailed logs:

```
🚀 Starting smart contract deployment for project: Test Project
📊 Total investments: 2
💰 Total raised: ₹100,000
👥 Unique investors: 2
📈 Shares (basis points): [6000, 4000]
✓ Shares sum: 10000
🎯 Repayment cap: ₹120,000 (~0.6 ETH)

📝 Executing deployment command...
   Owner: 0x1234...
   Payees: 2
   Network: Sepolia

✅ Contract deployed successfully!
📍 Contract address: 0x742d35Cc...
```

### Database Verification

```javascript
// MongoDB query
db.projects.findOne({ _id: ObjectId("PROJECT_ID") })

// Should see:
{
  splitterContractAddress: "0x742d35Cc...",
  status: "Live",
  currentFundingInr: 100000
}
```

---

## Troubleshooting Checklist

- [ ] Deployer wallet has Sepolia ETH (check: `web3Service.getWalletBalance()`)
- [ ] SEPOLIA_RPC_URL is correct and responsive
- [ ] OWNER_PRIVATE_KEY is set and valid
- [ ] Hardhat config has Sepolia network configured
- [ ] Creator and investors have wallet addresses
- [ ] Project funding goal is reasonable (not too small)
- [ ] Node.js can execute shell commands (`child_process` works)

---

## Success Criteria

After testing, you should have:

✅ Project created with status "Funding"  
✅ Investments recorded in database  
✅ Funding goal reached triggers deployment  
✅ Contract address stored in project  
✅ Project status changes to "Live"  
✅ Contract visible on Sepolia Etherscan  
✅ Contract has correct payees and shares  
✅ Payout simulation sends ETH to contract  
✅ Investors can withdraw their shares  
✅ All error cases handled gracefully  

---

## Next Steps After Testing

1. **Production Deployment**
   - Switch from Sepolia to mainnet
   - Update RPC URLs and contract addresses
   - Fund deployer wallet with real ETH

2. **Frontend Integration**
   - Display contract address on project page
   - Show investor share percentages
   - Add withdrawal button for investors

3. **Monitoring**
   - Set up alerts for failed deployments
   - Track gas costs
   - Monitor contract balances

4. **Security Audit**
   - Review smart contracts
   - Penetration testing
   - Gas optimization

---

**Happy Testing! 🚀**
