# 🚀 Quick Start Guide - Smart Contract Deployment

## Get Started in 5 Minutes

This guide will help you test the smart contract deployment feature immediately.

---

## ⚡ Prerequisites (2 minutes)

### 1. Get Sepolia ETH

Your deployer wallet needs test ETH to deploy contracts:

```bash
# Find your deployer address
# It's derived from your OWNER_PRIVATE_KEY in .env
```

**Get free Sepolia ETH:**
- Visit: https://sepoliafaucet.com/
- Enter your deployer address
- Request ETH
- Wait ~1 minute for confirmation

**Check balance:**
- Visit: https://sepolia.etherscan.io/address/YOUR_ADDRESS
- Should see: 0.5+ ETH

---

### 2. Verify Environment Variables

Check `backend/.env`:

```env
# Required for deployment
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
OWNER_PRIVATE_KEY=0x...your_private_key...
```

**Get Alchemy Key (if needed):**
1. Go to: https://www.alchemy.com/
2. Sign up (free)
3. Create app → Choose Sepolia
4. Copy API key

---

## 🧪 Test the Feature (3 minutes)

### Step 1: Start Backend

```bash
cd backend
npm install
npm start
```

Backend should start on: `http://localhost:5000`

---

### Step 2: Create Test Project

**Using Postman/Thunder Client/curl:**

```bash
# Login as Creator first
POST http://localhost:5000/api/auth/login
{
  "walletAddress": "0xYourCreatorAddress",
  "signature": "..."
}

# Create project
POST http://localhost:5000/api/projects
Authorization: Bearer YOUR_TOKEN
{
  "title": "Test Smart Contract Deployment",
  "description": "Testing automatic splitter deployment",
  "category": "Technology",
  "fundingGoalInr": 100000,
  "revenueSharePercent": 20
}
```

**Save the `_id` from response as `PROJECT_ID`**

---

### Step 3: Make Investments

**Investment 1 (60%):**

```bash
# Login as Investor 1
POST http://localhost:5000/api/auth/login
{
  "walletAddress": "0xInvestor1Address",
  "signature": "..."
}

# Invest
POST http://localhost:5000/api/investments/PROJECT_ID
Authorization: Bearer INVESTOR1_TOKEN
{
  "amount": 60000
}
```

**Expected:** Investment recorded, funding at 60%

---

**Investment 2 (40% - TRIGGERS DEPLOYMENT!):**

```bash
# Login as Investor 2
POST http://localhost:5000/api/auth/login
{
  "walletAddress": "0xInvestor2Address",
  "signature": "..."
}

# Invest (this will trigger deployment!)
POST http://localhost:5000/api/investments/PROJECT_ID
Authorization: Bearer INVESTOR2_TOKEN
{
  "amount": 40000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Investment successful! Funding goal reached and splitter contract deployed.",
  "splitterDeployed": true,
  "splitterAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
}
```

**Watch backend console for deployment logs! 🎉**

---

### Step 4: Verify on Etherscan

Copy the `splitterAddress` from response.

Visit: `https://sepolia.etherscan.io/address/SPLITTER_ADDRESS`

**You should see:**
- ✅ Contract created
- ✅ Recent deployment transaction
- ✅ Contract code (verified)

**Click "Contract" → "Read Contract" to see:**
- `totalShares()` = 10000
- `shares(investor1Address)` = 6000
- `shares(investor2Address)` = 4000
- `repaymentCap()` = ~0.6 ETH (in wei)

---

### Step 5: Simulate Payout

Send test ETH to the contract:

```bash
POST http://localhost:5000/api/projects/PROJECT_ID/simulate-payout
Authorization: Bearer ADMIN_TOKEN
{
  "amount": "0.1"
}
```

**Expected:**
```json
{
  "success": true,
  "message": "Successfully sent 0.1 ETH to splitter contract",
  "data": {
    "transactionHash": "0x...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
  }
}
```

**Verify:**
- Click explorerUrl to see transaction
- Check contract balance on Etherscan: Should be 0.1 ETH

---

### Step 6: Investor Withdraws (Optional)

**Using MetaMask + Etherscan:**

1. Go to: `https://sepolia.etherscan.io/address/SPLITTER_ADDRESS#writeContract`
2. Click "Connect to Web3"
3. Connect Investor1's wallet
4. Find: `release(address payable account)`
5. Enter: Investor1's address
6. Click "Write" → Confirm transaction

**Expected:**
- Investor1 receives: 0.06 ETH (60% of 0.1 ETH)
- Transaction confirmed on Etherscan

---

## 🎯 What You Just Did

✅ **Created a project** with ₹100,000 funding goal  
✅ **Made 2 investments** totaling ₹100,000  
✅ **Automatically deployed** a smart contract to Sepolia  
✅ **Simulated revenue** by sending 0.1 ETH to contract  
✅ **Investor withdrew** their proportional share  

**This is the complete end-to-end flow! 🚀**

---

## 🔍 Troubleshooting

### "Deployment failed: insufficient funds"

**Problem:** Deployer wallet has no Sepolia ETH

**Solution:**
1. Get your deployer address (from OWNER_PRIVATE_KEY)
2. Get Sepolia ETH from faucet
3. Retry investment or use manual deployment

---

### "Invalid contract address returned"

**Problem:** Hardhat script failed

**Solution:**
1. Test Hardhat manually:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network sepolia \
     --owner 0xYourAddress \
     --payees 0xInvestor1,0xInvestor2 \
     --shares 6000,4000 \
     --cap 1.0
   ```
2. Check for errors
3. Verify `hardhat.config.js` has Sepolia network

---

### "Investment successful, but splitter deployment failed"

**Problem:** Deployment error (network, gas, etc.)

**Solution:**
Use manual deployment endpoint:
```bash
POST http://localhost:5000/api/investments/deploy-splitter/PROJECT_ID
Authorization: Bearer ADMIN_TOKEN
```

---

## 📚 Next Steps

### Read Full Documentation

- **Implementation Details:** `docs/SMART_CONTRACT_DEPLOYMENT_IMPLEMENTATION.md`
- **Testing Scenarios:** `docs/SMART_CONTRACT_TESTING_GUIDE.md`
- **API Reference:** `docs/SMART_CONTRACT_API_REFERENCE.md`
- **Summary:** `docs/SMART_CONTRACT_IMPLEMENTATION_SUMMARY.md`

### Frontend Integration

Build UI components to:
- Display contract address on project page
- Show investor shares
- Add "Withdraw" button for investors
- Display pending payment amounts

### Production Checklist

Before mainnet:
- [ ] Security audit of contracts
- [ ] Test with multiple scenarios
- [ ] Set up monitoring
- [ ] Get real ETH for deployer wallet
- [ ] Update to mainnet RPC URL
- [ ] Test gas optimization

---

## 🆘 Need Help?

**Check Logs:**
```bash
# Backend logs show detailed deployment process
# Look for:
🚀 Starting smart contract deployment...
✅ Contract deployed successfully!
```

**Test Hardhat Directly:**
```bash
cd contracts
npx hardhat compile
npx hardhat test
```

**Verify Environment:**
```bash
# Check if deployer wallet is funded
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
provider.getBalance(wallet.address).then(b => console.log('Balance:', ethers.formatEther(b), 'ETH'));
"
```

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ A fully funded project  
✅ A deployed smart contract on Sepolia  
✅ Revenue sent to the contract  
✅ Investors who can withdraw their shares  

**The blockchain integration is working! 🚀**

---

**Ready for production when you are!**

For detailed testing scenarios and production deployment, see the full documentation in the `docs/` folder.
