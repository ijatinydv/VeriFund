# 🚀 Web3 Integration - Quick Reference Card

## TL;DR - It's Already Done! ✅

The Web3 integration is **fully implemented**. When a project reaches its funding goal, a smart contract is automatically deployed to Sepolia.

---

## 🎯 Critical Files

```
contracts/scripts/deploy.js          ← Parameterized deployment script
backend/src/services/web3.service.js ← Blockchain interface
backend/src/services/investment.service.js ← Auto-deployment trigger
backend/src/models/Project.model.js  ← Contract address storage
contracts/contracts/VeriFundSplitter.sol ← Revenue splitter contract
```

---

## ⚡ Quick Test

```bash
# 1. Ensure deployer wallet has Sepolia ETH
# Get from: https://sepoliafaucet.com/

# 2. Create project (funding goal: 100,000 INR)
POST /api/projects
{ "title": "Test", "fundingGoalInr": 100000, ... }

# 3. Make investment that reaches goal
POST /api/investments/:projectId
{ "amount": 100000 }

# 4. Check response for:
{
  "splitterDeployed": true,
  "splitterAddress": "0x..."
}

# 5. Verify on Etherscan
https://sepolia.etherscan.io/address/0x...
```

---

## 🔑 Environment Variables

```bash
# backend/.env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
OWNER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# contracts/.env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

---

## 📊 How It Works

```
Investment → Goal Reached? → YES → Deploy Contract → Save Address → Status: Live
                           ↓
                          NO → Normal Investment → Status: Funding
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Insufficient funds" | Add Sepolia ETH to deployer wallet |
| "Invalid address" | Ensure all users have `walletAddress` field |
| "Deployment timeout" | Check Sepolia network status, increase timeout |
| "Manual deployment needed" | Use `/api/investments/deploy-splitter/:projectId` |

---

## 📚 Full Documentation

1. **WEB3_INTEGRATION_COMPLETE.md** - Complete implementation guide
2. **WEB3_INTEGRATION_TESTING.md** - Step-by-step testing guide
3. **WEB3_ARCHITECTURE_DIAGRAM.md** - Visual architecture & data flow
4. **WEB3_INTEGRATION_SUMMARY.md** - Executive summary

---

## 🎓 Key Concepts

**Basis Points**: 10,000 = 100% (e.g., 5,000 = 50% share)

**Repayment Cap**: 120% of funding goal (prevents unlimited liability)

**Pull Pattern**: Investors call `release()` to withdraw (safer than push)

**Deployment Trigger**: `currentFundingInr >= fundingGoalInr && !splitterContractAddress`

---

## 🔐 Security Features

✅ Address validation  
✅ Share calculation verification  
✅ ReentrancyGuard  
✅ Pausable (emergency freeze)  
✅ Ownable (creator controls)  
✅ Repayment cap enforcement  

---

## 🧪 Test Payout

```javascript
// Simulate sending revenue to contract
const web3 = require('./backend/src/services/web3.service');
await web3.simulatePayout('0xCONTRACT_ADDRESS', '0.1');

// Investor withdraws share on Etherscan:
// Contract → Write Contract → release(investorAddress)
```

---

## 🆘 Emergency Recovery

If auto-deployment fails:

```bash
POST /api/investments/deploy-splitter/:projectId
Authorization: Bearer [CREATOR_TOKEN]
```

This manually triggers deployment for funded projects.

---

## ✅ Checklist Before Testing

- [ ] Sepolia RPC URL configured
- [ ] Private key in .env (never commit!)
- [ ] Deployer wallet has ≥ 0.1 ETH
- [ ] MongoDB running
- [ ] Hardhat dependencies installed (`cd contracts && npm install`)
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Users have valid wallet addresses

---

## 📈 Expected Flow

1. **Create Project**: Status = "Funding"
2. **Investments < Goal**: Status = "Funding"
3. **Investment Reaches Goal**: 
   - Status = "Live"
   - Contract deployed
   - `splitterContractAddress` saved
4. **Payout Simulation**: Send ETH to contract
5. **Investors Withdraw**: Call `release()` on contract

---

## 🎯 Success Indicators

✅ Contract address in project document  
✅ Project status changed to "Live"  
✅ Contract visible on Sepolia Etherscan  
✅ Constructor args match investor shares  
✅ Owner is project creator  
✅ Investors can withdraw their share  

---

## 💡 Pro Tips

- Test with small amounts first (0.01 ETH)
- Bookmark your deployed contracts on Etherscan
- Keep track of deployment gas costs
- Use mainnet only after thorough Sepolia testing
- Verify contracts on Etherscan for transparency
- Monitor deployer wallet balance regularly

---

## 🔗 Useful Links

- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **Alchemy Dashboard**: https://dashboard.alchemy.com/
- **Hardhat Docs**: https://hardhat.org/docs

---

## 📞 Quick Debug Commands

```bash
# Check deployer balance
node -e "require('./backend/src/services/web3.service').getWalletBalance().then(console.log)"

# Check gas price
node -e "require('./backend/src/services/web3.service').getGasPrice().then(console.log)"

# View project in DB
mongo verifund --eval "db.projects.findOne({_id: ObjectId('PROJECT_ID')})"

# View investments
mongo verifund --eval "db.investments.find({project: ObjectId('PROJECT_ID')})"
```

---

## 🏆 What You Have Now

1. ✅ **Auto-deployment system** - No manual intervention needed
2. ✅ **Secure smart contracts** - Industry-standard security patterns
3. ✅ **Error recovery** - Graceful handling of failures
4. ✅ **Complete documentation** - Implementation & testing guides
5. ✅ **Revenue distribution** - Fair, transparent, capped payouts

---

## 🚀 Ready to Ship!

Your VeriFund platform has **production-grade Web3 integration**. Just test it on Sepolia, and you're good to go!

**Questions?** Refer to the comprehensive docs in the `docs/` folder.

---

**Created**: October 14, 2025  
**Status**: ✅ Ready for Testing  
**Next Step**: Deploy a test project and verify the contract!
