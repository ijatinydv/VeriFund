# ✅ Web3 Integration Verification Checklist

Use this checklist to verify your Web3 integration is working correctly.

---

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] **Backend .env file configured**
  - [ ] `MONGO_URI` set
  - [ ] `JWT_SECRET` set
  - [ ] `SEPOLIA_RPC_URL` set (Alchemy/Infura)
  - [ ] `OWNER_PRIVATE_KEY` set (deployer wallet)
  - [ ] No private keys committed to Git

- [ ] **Contracts .env file configured**
  - [ ] `SEPOLIA_RPC_URL` set (same as backend)
  - [ ] `PRIVATE_KEY` set (same as OWNER_PRIVATE_KEY)
  - [ ] `ETHERSCAN_API_KEY` set (optional, for verification)

- [ ] **Dependencies installed**
  - [ ] Backend: `cd backend && npm install`
  - [ ] Contracts: `cd contracts && npm install`
  - [ ] All packages up to date

- [ ] **Sepolia Test ETH obtained**
  - [ ] Deployer wallet has ≥ 0.1 ETH
  - [ ] Verified at: https://sepolia.etherscan.io/address/[YOUR_WALLET]

- [ ] **MongoDB running**
  - [ ] Service started
  - [ ] Database `verifund` exists
  - [ ] Collections created (users, projects, investments)

- [ ] **Contracts compiled**
  - [ ] `cd contracts && npm run compile`
  - [ ] No compilation errors
  - [ ] `artifacts/` folder generated

---

## 🧪 Component Testing

### Test 1: Deployment Script (Standalone)

- [ ] **Navigate to contracts folder**
  ```bash
  cd contracts
  ```

- [ ] **Run deployment with test data**
  ```bash
  npx hardhat run scripts/deploy.js --network sepolia \
    --owner 0xYOUR_WALLET \
    --payees 0xTEST1,0xTEST2 \
    --shares 5000,5000 \
    --cap 0.5
  ```

- [ ] **Verify output**
  - [ ] Single line with contract address
  - [ ] No extra console.log output
  - [ ] Address starts with `0x` and is 42 characters

- [ ] **Check on Etherscan**
  - [ ] Contract exists at the address
  - [ ] Transaction confirmed
  - [ ] Constructor arguments visible

**Status**: [ ] PASS  [ ] FAIL

---

### Test 2: Backend Web3 Service

- [ ] **Start backend**
  ```bash
  cd backend
  npm run dev
  ```

- [ ] **Verify Web3 service initialization**
  - [ ] Console shows: `✅ Web3 Service initialized with wallet: 0x...`
  - [ ] No errors about missing private key
  - [ ] Wallet address matches your deployer wallet

- [ ] **Test wallet balance (Node REPL)**
  ```javascript
  const web3 = require('./src/services/web3.service');
  web3.getWalletBalance().then(console.log);
  ```
  - [ ] Returns balance (e.g., "0.5")
  - [ ] No errors

- [ ] **Test gas price**
  ```javascript
  web3.getGasPrice().then(console.log);
  ```
  - [ ] Returns gas price in Gwei
  - [ ] No errors

**Status**: [ ] PASS  [ ] FAIL

---

### Test 3: Database Schema

- [ ] **Check Project model**
  ```javascript
  const Project = require('./src/models/Project.model');
  console.log(Project.schema.paths.splitterContractAddress);
  ```
  - [ ] Field exists
  - [ ] Type is String
  - [ ] Validation regex present

- [ ] **Create test project**
  ```javascript
  const project = new Project({
    creator: 'SOME_USER_ID',
    title: 'Test Project',
    fundingGoalInr: 100000,
    revenueSharePercent: 10
  });
  console.log(project.splitterContractAddress); // Should be undefined
  project.splitterContractAddress = '0x1234567890123456789012345678901234567890';
  project.validate().then(() => console.log('Valid!'));
  ```
  - [ ] Accepts valid address
  - [ ] Validates address format

**Status**: [ ] PASS  [ ] FAIL

---

## 🚀 End-to-End Testing

### Test 4: Complete Investment Flow

**Step 1: Setup**

- [ ] **Backend running** (`npm run dev` in backend/)
- [ ] **MongoDB running**
- [ ] **Postman/curl ready** for API testing

**Step 2: Register Users**

- [ ] **Register Creator**
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "walletAddress": "0xCREATOR_WALLET",
      "name": "Test Creator",
      "email": "creator@test.com",
      "password": "test123",
      "role": "Creator"
    }'
  ```
  - [ ] Returns `token`
  - [ ] Status 200/201

- [ ] **Save creator token**: `__________________`

- [ ] **Register Investor 1**
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "walletAddress": "0xINVESTOR1_WALLET",
      "name": "Investor One",
      "email": "inv1@test.com",
      "password": "test123",
      "role": "Investor"
    }'
  ```
  - [ ] Returns token
  - [ ] Status 200/201

- [ ] **Save investor1 token**: `__________________`

- [ ] **Register Investor 2** (repeat above with different email/wallet)
  - [ ] Returns token
  - [ ] Status 200/201

- [ ] **Save investor2 token**: `__________________`

**Step 3: Create Project**

- [ ] **Create project**
  ```bash
  curl -X POST http://localhost:3000/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer CREATOR_TOKEN" \
    -d '{
      "title": "Test Smart Contract Deployment",
      "description": "Testing automatic deployment",
      "category": "Technology",
      "fundingGoalInr": 100000,
      "revenueSharePercent": 15
    }'
  ```
  - [ ] Returns project with `_id`
  - [ ] `status` is "Funding"
  - [ ] `splitterContractAddress` is null/undefined

- [ ] **Save project ID**: `__________________`

**Step 4: Make First Investment (Below Goal)**

- [ ] **Invest ₹40,000**
  ```bash
  curl -X POST http://localhost:3000/api/investments/PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer INVESTOR1_TOKEN" \
    -d '{ "amount": 40000 }'
  ```
  - [ ] Status 200/201
  - [ ] `splitterDeployed` is `false`
  - [ ] Project `status` still "Funding"
  - [ ] `currentFundingInr` is 40000

**Step 5: Make Second Investment (Reaches Goal)**

- [ ] **Invest ₹60,000**
  ```bash
  curl -X POST http://localhost:3000/api/investments/PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer INVESTOR2_TOKEN" \
    -d '{ "amount": 60000 }'
  ```

**CRITICAL CHECKS**:

- [ ] **Response contains**:
  - [ ] `"splitterDeployed": true`
  - [ ] `"splitterAddress": "0x..."`
  - [ ] `"message"` mentions deployment
  - [ ] Project `status` is "Live"
  - [ ] Project `currentFundingInr` is 100000

- [ ] **Backend console logs show**:
  - [ ] "🎉 Funding goal reached! Deploying splitter contract..."
  - [ ] "🚀 Starting smart contract deployment for project: ..."
  - [ ] "📊 Total investments: 2"
  - [ ] "👥 Unique investors: 2"
  - [ ] "📈 Shares (basis points): [ 6000, 4000 ]" (or similar)
  - [ ] "✓ Shares sum: 10000 (must be 10000)"
  - [ ] "✅ Contract deployed successfully!"
  - [ ] "📍 Contract address: 0x..."
  - [ ] "🔗 View on Etherscan: https://sepolia.etherscan.io/address/0x..."

- [ ] **Save contract address**: `__________________`

**Status**: [ ] PASS  [ ] FAIL

---

### Test 5: Verify Deployment on Blockchain

- [ ] **Open Etherscan**
  - URL: `https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]`

- [ ] **Contract page checks**:
  - [ ] Contract exists
  - [ ] Balance is 0 ETH (initially)
  - [ ] "Contract" tab shows bytecode
  - [ ] Transaction history shows deployment

- [ ] **Read Contract (if verified)**:
  - [ ] `repaymentCap` is set (in Wei)
  - [ ] `totalShares` is 10000
  - [ ] `payeesCount()` returns 2
  - [ ] `shares(investor1Address)` returns 6000
  - [ ] `shares(investor2Address)` returns 4000

**Status**: [ ] PASS  [ ] FAIL

---

### Test 6: Database Verification

- [ ] **Check project in MongoDB**
  ```javascript
  db.projects.findOne({ _id: ObjectId("PROJECT_ID") })
  ```
  - [ ] `status` is "Live"
  - [ ] `splitterContractAddress` is set
  - [ ] `currentFundingInr` is 100000
  - [ ] `investorCount` is 2

- [ ] **Check investments**
  ```javascript
  db.investments.find({ project: ObjectId("PROJECT_ID") })
  ```
  - [ ] 2 investment documents
  - [ ] Both have `status: "Confirmed"`
  - [ ] Amounts are 40000 and 60000

**Status**: [ ] PASS  [ ] FAIL

---

## 💰 Revenue Distribution Testing

### Test 7: Simulate Payout

- [ ] **Create test script** (`test-payout.js`):
  ```javascript
  const web3 = require('./backend/src/services/web3.service');
  
  async function test() {
    const result = await web3.simulatePayout(
      '0xYOUR_CONTRACT_ADDRESS',
      '0.01' // 0.01 ETH
    );
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Explorer:', result.explorerUrl);
  }
  
  test().catch(console.error);
  ```

- [ ] **Run script**
  ```bash
  cd backend
  node test-payout.js
  ```

- [ ] **Verify output**:
  - [ ] "💸 Simulating payout to contract: ..."
  - [ ] "💳 Wallet balance: ..." (shows sufficient balance)
  - [ ] "✅ Transaction confirmed in block ..."
  - [ ] Transaction hash printed

- [ ] **Check on Etherscan**:
  - [ ] Contract balance increased by 0.01 ETH
  - [ ] Transaction visible in contract's history
  - [ ] "Receive" event emitted

**Status**: [ ] PASS  [ ] FAIL

---

### Test 8: Investor Withdrawal

- [ ] **Connect to contract on Etherscan**:
  - Go to contract address on Sepolia Etherscan
  - Click "Contract" → "Write Contract"
  - Click "Connect to Web3" (MetaMask)

- [ ] **Switch to investor wallet in MetaMask**
  - Import investor1 wallet (use private key)

- [ ] **Check pending payment**:
  - Go to "Read Contract"
  - Call `pendingPayment(investor1Address)`
  - [ ] Returns value > 0 (their share of 0.01 ETH)

- [ ] **Withdraw funds**:
  - Go to "Write Contract"
  - Call `release(investor1Address)`
  - Confirm transaction in MetaMask
  - [ ] Transaction confirmed
  - [ ] Investor receives ETH
  - [ ] `released(investor1Address)` increased
  - [ ] `totalReleased` increased

**Status**: [ ] PASS  [ ] FAIL

---

## 🚨 Error Handling Tests

### Test 9: Deployment Failure Recovery

- [ ] **Temporarily break deployment**:
  - Set wrong RPC URL in `.env`
  - OR temporarily remove deployer wallet ETH

- [ ] **Make investment that reaches goal**:
  ```bash
  curl -X POST http://localhost:3000/api/investments/NEW_PROJECT_ID \
    -H "Authorization: Bearer INVESTOR_TOKEN" \
    -d '{ "amount": 100000 }'
  ```

- [ ] **Verify graceful failure**:
  - [ ] Investment still saved in database
  - [ ] `splitterDeployed` is `false`
  - [ ] Response includes `error` message
  - [ ] Project `status` is still "Funding"
  - [ ] Project `splitterContractAddress` is null

- [ ] **Fix the issue** (correct RPC URL / add ETH)

- [ ] **Manual deployment**:
  ```bash
  curl -X POST http://localhost:3000/api/investments/deploy-splitter/PROJECT_ID \
    -H "Authorization: Bearer CREATOR_TOKEN"
  ```
  - [ ] Contract deploys successfully
  - [ ] Project updated with address
  - [ ] Status changed to "Live"

**Status**: [ ] PASS  [ ] FAIL

---

### Test 10: Edge Cases

- [ ] **Test: Creator tries to invest in own project**
  ```bash
  curl -X POST http://localhost:3000/api/investments/PROJECT_ID \
    -H "Authorization: Bearer CREATOR_TOKEN" \
    -d '{ "amount": 10000 }'
  ```
  - [ ] Returns error
  - [ ] Message: "Creators cannot invest in their own project"

- [ ] **Test: Investment exceeds remaining goal**
  - Create project with ₹100,000 goal
  - Invest ₹60,000
  - Try to invest ₹50,000 (would exceed)
  - [ ] Returns error
  - [ ] Message mentions "would exceed funding goal"

- [ ] **Test: Investment on non-Funding project**
  - Try to invest in project with status "Live"
  - [ ] Returns error
  - [ ] Message mentions project not accepting investments

**Status**: [ ] PASS  [ ] FAIL

---

## 📊 Final Verification

### Overall System Health

- [ ] **All tests passed**
- [ ] **No errors in backend console**
- [ ] **No errors in MongoDB**
- [ ] **Contracts deployed successfully**
- [ ] **Investors can withdraw funds**
- [ ] **Documentation reviewed**

### Security Checks

- [ ] Private keys NOT committed to Git
- [ ] `.env` files in `.gitignore`
- [ ] All addresses validated before use
- [ ] Share calculations verified (sum = 10000)
- [ ] Repayment cap enforced on-chain

### Performance Checks

- [ ] Deployment completes in < 90 seconds
- [ ] API responses in < 500ms (excluding deployment)
- [ ] Database queries optimized
- [ ] No memory leaks observed

---

## 🎉 Success Criteria

Your Web3 integration is **fully functional** if:

✅ All 10 tests pass  
✅ Contracts deploy automatically when funding goal reached  
✅ Contract addresses saved to database  
✅ Investors can withdraw their proportional share  
✅ Error handling works gracefully  
✅ Manual recovery option available  

---

## 📝 Sign-Off

**Tested by**: ________________  
**Date**: ________________  
**Environment**: [ ] Development  [ ] Staging  [ ] Production  

**Overall Status**: [ ] PASS  [ ] FAIL  

**Notes**:
```
______________________________________________________________
______________________________________________________________
______________________________________________________________
```

---

## 🆘 If Tests Fail

1. **Check logs** - Look at backend console for errors
2. **Review docs** - Refer to `WEB3_INTEGRATION_COMPLETE.md`
3. **Verify env vars** - Ensure all required variables set
4. **Check balance** - Deployer wallet needs sufficient ETH
5. **Network status** - Verify Sepolia testnet is operational
6. **Dependencies** - Re-run `npm install` in both folders

**Common fixes**:
- Restart backend after `.env` changes
- Clear MongoDB and re-test from scratch
- Get fresh Sepolia ETH if balance depleted
- Check Alchemy/Infura API key is valid

---

**Checklist Version**: 1.0  
**Last Updated**: October 14, 2025  
**Compatible With**: VeriFund v1.0+
