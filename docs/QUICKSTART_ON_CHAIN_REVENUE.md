# 🚀 Quick Start: On-Chain Revenue Withdrawal Feature

## What's New?

Creators can now view and withdraw their share of project revenue directly from the blockchain using the **On-Chain Revenue Card** on their Creator Dashboard.

---

## 🎯 How to Use (Creator Perspective)

### Step 1: Connect Your Wallet
1. Navigate to the VeriFund website
2. Click "Connect Wallet" in the top navigation
3. Select your wallet (MetaMask recommended)
4. Approve the connection and sign the authentication message

### Step 2: View Your Projects
1. Go to **Creator Dashboard** (automatically shown after login if you're a creator)
2. You'll see all your projects displayed as cards

### Step 3: Check On-Chain Revenue
For each project with a deployed smart contract, you'll see a **green "On-Chain Revenue" card** below the project card showing:
- Project name
- Available ETH balance to withdraw
- "Withdraw Funds to Wallet" button

### Step 4: Withdraw Funds
1. Click the **"Withdraw Funds to Wallet"** button
2. MetaMask will open asking you to approve the transaction
3. Review the transaction details (gas fee, etc.)
4. Click "Confirm" in MetaMask
5. Wait for the transaction to be confirmed (10-30 seconds)
6. You'll see a success message 🎉
7. The funds will appear in your wallet
8. The balance on the card will update to reflect the withdrawal

---

## 💻 Developer Setup

### Prerequisites
- Node.js 16+ installed
- MetaMask or compatible Web3 wallet
- Access to Sepolia testnet (for testing) or Ethereum mainnet

### Installation
No additional packages needed! The implementation uses existing dependencies:
- `wagmi` v1.4.13 (already installed)
- `viem` v2.38.0 (already installed)
- `@mui/material` (already installed)
- `react-hot-toast` (already installed)

### Running the Application

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

---

## 🧪 Testing Locally

### Test Scenario 1: With Mock Data

If you don't have a deployed contract yet, you can test the UI by:

1. **Temporarily modify a project in the database** to add a mock contract address:
   ```javascript
   // In your database, add this field to a project:
   splitterContractAddress: "0x1234567890123456789012345678901234567890"
   ```

2. The component will attempt to read from this address (it will fail gracefully)
3. This lets you see the UI and layout

### Test Scenario 2: With Real Contract (Recommended)

1. **Deploy a VeriFundSplitter contract** (see contract deployment docs)
2. **Send some test ETH to the contract** (on Sepolia testnet)
3. **Update the project in the database** with the real contract address
4. **Connect your wallet** (the same address that's registered as a payee)
5. **View your dashboard** - you should see the real balance
6. **Test withdrawal** - try withdrawing the funds

### Getting Test ETH (Sepolia Testnet)

Visit any Sepolia faucet:
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia
- https://faucet.quicknode.com/ethereum/sepolia

---

## 📂 Files Changed

Here's what was added/modified:

```
frontend/
├── src/
│   ├── abi/
│   │   └── VeriFundSplitter.json          ← NEW: Contract ABI
│   ├── components/
│   │   └── project/
│   │       └── ProjectRevenueCard.jsx     ← NEW: Revenue withdrawal component
│   └── pages/
│       └── CreatorDashboard.jsx           ← MODIFIED: Added ProjectRevenueCard
docs/
└── ON_CHAIN_REVENUE_WITHDRAWAL_IMPLEMENTATION.md  ← NEW: Full documentation
```

---

## 🔧 Configuration

### Supported Networks

By default, the app supports:
- **Ethereum Mainnet** (chainId: 1)
- **Sepolia Testnet** (chainId: 11155111)

These are configured in `frontend/src/services/wagmiConfig.js`.

### Adding More Networks

To add support for additional networks (e.g., Polygon, Arbitrum):

1. Edit `frontend/src/services/wagmiConfig.js`
2. Import the chain from wagmi:
   ```javascript
   import { polygon } from 'wagmi/chains';
   ```
3. Add it to the chains array:
   ```javascript
   chains: [mainnet, sepolia, polygon]
   ```
4. Add transport:
   ```javascript
   transports: {
     [mainnet.id]: http(),
     [sepolia.id]: http(),
     [polygon.id]: http(),
   }
   ```

---

## 🎨 Customization

### Styling the Revenue Card

The component uses Material-UI's `sx` prop for styling. You can customize colors, spacing, etc. in `ProjectRevenueCard.jsx`:

```jsx
// Example: Change the card gradient
background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.08) 0%, rgba(0, 191, 165, 0.08) 100%)',

// Example: Change the button color
<Button color="success" ... >
```

### Adjusting Decimal Precision

To show more or fewer decimal places for ETH:

```jsx
// In ProjectRevenueCard.jsx, line ~157
{withdrawableAmount.toFixed(6)}  // Change 6 to your preferred precision
```

---

## 🔐 Security Notes

### For Users:
- ✅ Always verify the contract address before withdrawing
- ✅ Check the transaction details in MetaMask before approving
- ✅ Ensure you're on the correct network (Mainnet/Sepolia)
- ❌ Never share your private keys or seed phrase
- ❌ Don't approve transactions you don't understand

### For Developers:
- ✅ The smart contract uses industry-standard security patterns
- ✅ Reentrancy protection is enabled
- ✅ Pull-over-push withdrawal pattern prevents forced transactions
- ✅ All state changes follow Checks-Effects-Interactions pattern
- ✅ Contract is pausable in emergencies

---

## ❓ FAQ

### Q: Why don't I see the revenue card?
**A:** The card only appears if:
- Your wallet is connected
- The project has a `splitterContractAddress` in the database
- You're viewing the Creator Dashboard

### Q: Why does my balance show 0?
**A:** Possible reasons:
- No revenue has been sent to the contract yet
- You've already withdrawn all available funds
- You're not registered as a payee in the contract
- The contract's repayment cap has been reached

### Q: How much does withdrawal cost?
**A:** You'll pay standard Ethereum gas fees (varies by network congestion). The contract itself doesn't charge any fees, but you'll see the gas cost in MetaMask before approving.

### Q: How long does withdrawal take?
**A:** Typically 10-30 seconds on Ethereum. Sepolia testnet may be faster (5-15 seconds).

### Q: Can I withdraw to a different address?
**A:** No, withdrawals always go to your connected wallet address (the registered payee address). This is a security feature.

### Q: What happens if I close the browser during withdrawal?
**A:** The transaction is submitted to the blockchain and will complete regardless. You can check the status on Etherscan using your wallet address.

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to prepare transaction"
**Solution:** 
- Ensure you have some ETH for gas fees
- Check you're on the correct network
- Verify the contract address is valid

### Issue: Transaction keeps pending
**Solution:**
- Check Etherscan for transaction status
- Network may be congested - wait longer
- Can try increasing gas price in MetaMask settings

### Issue: "Connector not connected" error
**Solution:**
- Disconnect and reconnect your wallet
- Refresh the page
- Clear browser cache

---

## 📊 What's Next?

This feature is just the beginning! Future enhancements planned:
- 📈 Transaction history and analytics
- 💱 Multi-currency display (ETH + USD value)
- 📧 Email notifications for available revenue
- 🔄 Batch withdrawals from multiple projects
- ⚡ Gas optimization suggestions

---

## 🎉 You're All Set!

The on-chain revenue withdrawal feature is now live and ready to use. Connect your wallet and start withdrawing your hard-earned project revenue!

**Need Help?** Check the full documentation in `docs/ON_CHAIN_REVENUE_WITHDRAWAL_IMPLEMENTATION.md`

---

**Happy Building! 🚀**
