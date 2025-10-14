# Web3 Integration Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VERIFUND WEB3 INTEGRATION                             │
│                         Automatic Smart Contract Deployment                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: FRONTEND (React + Vite)                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP POST /api/investments/:projectId
                                      │ { amount: 50000 }
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: BACKEND API (Express + Node.js)                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ investment.controller.js                                                 │  │
│  │  - Validates request                                                     │  │
│  │  - Extracts investorId from JWT token                                   │  │
│  │  - Calls investment.service.createInvestment()                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ investment.service.js                                                    │  │
│  │                                                                          │  │
│  │  1. Validate investment amount                                          │  │
│  │  2. Find project by ID                                                  │  │
│  │  3. Check project status == 'Funding'                                   │  │
│  │  4. Create Investment record                                            │  │
│  │  5. Update project.currentFundingInr += amount                          │  │
│  │  6. Update project.investorCount += 1                                   │  │
│  │  7. Save project                                                        │  │
│  │                                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ CRITICAL DECISION POINT                                            │ │  │
│  │  │                                                                    │ │  │
│  │  │  if (currentFundingInr >= fundingGoalInr &&                        │ │  │
│  │  │      !splitterContractAddress) {                                   │ │  │
│  │  │                                                                    │ │  │
│  │  │    🚀 TRIGGER DEPLOYMENT 🚀                                        │ │  │
│  │  │  }                                                                 │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  │                                      │                                   │  │
│  │                                      ▼                                   │  │
│  │  8. Fetch all investments for project (populated with investor data)    │  │
│  │  9. Populate project.creator with wallet address                        │  │
│  │  10. Call web3Service.deploySplitterContract(project, investments)      │  │
│  │  11. Update project.splitterContractAddress = contractAddress           │  │
│  │  12. Update project.status = 'Live'                                     │  │
│  │  13. Return success with deployed contract address                      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ web3.service.js                                                          │  │
│  │                                                                          │  │
│  │  deploySplitterContract(project, investments):                          │  │
│  │                                                                          │  │
│  │  Step 1: Validate Inputs                                                │  │
│  │    ✓ project.creator.walletAddress exists                               │  │
│  │    ✓ investments.length > 0                                             │  │
│  │    ✓ All investors have valid walletAddress                             │  │
│  │                                                                          │  │
│  │  Step 2: Prepare Constructor Arguments                                  │  │
│  │    - initialOwner = project.creator.walletAddress                       │  │
│  │    - Group investments by unique investor addresses                     │  │
│  │    - Calculate share percentages in basis points (10000 = 100%)         │  │
│  │    - Adjust largest share to ensure sum = exactly 10000                 │  │
│  │    - Convert funding goal to ETH repayment cap (120% * goal / rate)     │  │
│  │                                                                          │  │
│  │  Step 3: Build Hardhat Command                                          │  │
│  │    cd ../contracts &&                                                   │  │
│  │    npx hardhat run scripts/deploy.js --network sepolia                  │  │
│  │      --owner 0x...                                                      │  │
│  │      --payees 0x...,0x...,0x...                                         │  │
│  │      --shares 5000,3000,2000                                            │  │
│  │      --cap 0.6                                                          │  │
│  │                                                                          │  │
│  │  Step 4: Execute Deployment                                             │  │
│  │    - Spawn child process with 120s timeout                              │  │
│  │    - Capture stdout (contract address)                                  │  │
│  │    - Capture stderr (warnings/errors)                                   │  │
│  │                                                                          │  │
│  │  Step 5: Validate & Return                                              │  │
│  │    - Parse contract address from stdout                                 │  │
│  │    - Validate with ethers.isAddress()                                   │  │
│  │    - Return address or throw error                                      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │
                                       │ child_process.exec()
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: HARDHAT ENVIRONMENT (Solidity + Ethers.js)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ contracts/scripts/deploy.js                                              │  │
│  │                                                                          │  │
│  │  Step 1: Parse Command-Line Arguments                                   │  │
│  │    - Use process.argv.slice(2)                                          │  │
│  │    - Extract: --owner, --payees, --shares, --cap                        │  │
│  │                                                                          │  │
│  │  Step 2: Validate Arguments                                             │  │
│  │    - All required params present                                        │  │
│  │    - Valid Ethereum addresses                                           │  │
│  │    - Payees count == shares count                                       │  │
│  │    - At least one payee                                                 │  │
│  │                                                                          │  │
│  │  Step 3: Parse & Convert                                                │  │
│  │    - Split payees: "0x...,0x..." → [0x..., 0x...]                       │  │
│  │    - Split shares: "5000,5000" → [5000, 5000]                           │  │
│  │    - Convert cap: "0.6" → ethers.parseEther("0.6")                      │  │
│  │                                                                          │  │
│  │  Step 4: Get Contract Factory                                           │  │
│  │    const Splitter = await ethers.getContractFactory(                    │  │
│  │      "VeriFundSplitter"                                                 │  │
│  │    );                                                                   │  │
│  │                                                                          │  │
│  │  Step 5: Deploy Contract                                                │  │
│  │    const splitter = await Splitter.deploy(                              │  │
│  │      initialOwner,    // Project creator                                │  │
│  │      payeeAddresses,  // Investor wallets                               │  │
│  │      payeeShares,     // Basis points [5000, 3000, 2000]                │  │
│  │      repaymentCapWei  // Max payout in Wei                              │  │
│  │    );                                                                   │  │
│  │                                                                          │  │
│  │  Step 6: Wait for Deployment                                            │  │
│  │    await splitter.waitForDeployment();                                  │  │
│  │    const address = await splitter.getAddress();                         │  │
│  │                                                                          │  │
│  │  Step 7: Output Address (ONLY OUTPUT!)                                  │  │
│  │    console.log(address);  // 0x1234...                                  │  │
│  │    process.exit(0);                                                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │
                                       │ RPC Call to Sepolia
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: BLOCKCHAIN (Sepolia Testnet)                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ VeriFundSplitter Contract                                                │  │
│  │                                                                          │  │
│  │  constructor(                                                            │  │
│  │    address initialOwner,          // Project creator (Admin)            │  │
│  │    address payable[] _payees,     // Investor addresses                 │  │
│  │    uint256[] _shares,             // Share basis points                 │  │
│  │    uint256 _repaymentCap          // Max distribution in Wei            │  │
│  │  )                                                                       │  │
│  │                                                                          │  │
│  │  State Variables:                                                        │  │
│  │    mapping(address => uint256) public shares;                           │  │
│  │    mapping(address => uint256) public released;                         │  │
│  │    uint256 public totalShares = 10000;                                  │  │
│  │    uint256 public totalReleased = 0;                                    │  │
│  │    uint256 public repaymentCap;                                         │  │
│  │    address payable[] public payees;                                     │  │
│  │                                                                          │  │
│  │  Security Features:                                                      │  │
│  │    ✓ Ownable (creator controls)                                         │  │
│  │    ✓ Pausable (emergency freeze)                                        │  │
│  │    ✓ ReentrancyGuard (prevent reentrancy)                               │  │
│  │    ✓ Pull-over-push withdrawal pattern                                  │  │
│  │                                                                          │  │
│  │  Key Functions:                                                          │  │
│  │    - receive() - Accept ETH payments                                    │  │
│  │    - release(address) - Investor withdraws their share                  │  │
│  │    - pendingPayment(address) - Check available amount                   │  │
│  │    - remainingCap() - Check remaining distribution limit                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Contract Address: 0x1234567890123456789012345678901234567890                  │
│  Deployed Block: 5123456                                                       │
│  Network: Sepolia Testnet (Chain ID: 11155111)                                 │
│  View: https://sepolia.etherscan.io/address/0x...                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Return to Backend
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: DATABASE (MongoDB)                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ Project Document (UPDATED)                                               │  │
│  │  {                                                                       │  │
│  │    _id: ObjectId("673..."),                                              │  │
│  │    title: "Revolutionary AI Startup",                                   │  │
│  │    creator: ObjectId("672..."),                                          │  │
│  │    status: "Live",  ⬅️ UPDATED from "Funding"                           │  │
│  │    fundingGoalInr: 100000,                                               │  │
│  │    currentFundingInr: 100000,                                            │  │
│  │    splitterContractAddress: "0x1234...",  ⬅️ NEWLY SET                  │  │
│  │    investorCount: 2,                                                     │  │
│  │    investments: [                                                        │  │
│  │      { investor: ObjectId("673..."), amount: 60000 },                    │  │
│  │      { investor: ObjectId("674..."), amount: 40000 }                     │  │
│  │    ]                                                                     │  │
│  │  }                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ Investment Documents                                                     │  │
│  │                                                                          │  │
│  │  Investment 1:                                                           │  │
│  │  {                                                                       │  │
│  │    _id: ObjectId("675..."),                                              │  │
│  │    investor: ObjectId("673..."),                                         │  │
│  │    project: ObjectId("673..."),                                          │  │
│  │    amountInr: 60000,                                                     │  │
│  │    sharePercent: 60,                                                     │  │
│  │    transactionHash: "0xabc...",                                          │  │
│  │    status: "Confirmed"                                                   │  │
│  │  }                                                                       │  │
│  │                                                                          │  │
│  │  Investment 2:                                                           │  │
│  │  {                                                                       │  │
│  │    _id: ObjectId("676..."),                                              │  │
│  │    investor: ObjectId("674..."),                                         │  │
│  │    project: ObjectId("673..."),                                          │  │
│  │    amountInr: 40000,                                                     │  │
│  │    sharePercent: 40,                                                     │  │
│  │    transactionHash: "0xdef...",                                          │  │
│  │    status: "Confirmed"                                                   │  │
│  │  }                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Response to Frontend
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FINAL RESPONSE                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  {                                                                              │
│    "success": true,                                                             │
│    "message": "Investment successful! Funding goal reached and splitter         │
│                contract deployed.",                                             │
│    "investment": {                                                              │
│      "_id": "676...",                                                           │
│      "amountInr": 40000,                                                        │
│      "sharePercent": 40                                                         │
│    },                                                                           │
│    "project": {                                                                 │
│      "_id": "673...",                                                           │
│      "status": "Live",                                                          │
│      "currentFundingInr": 100000,                                               │
│      "fundingGoalInr": 100000,                                                  │
│      "splitterContractAddress": "0x1234567890123456789012345678901234567890"    │
│    },                                                                           │
│    "splitterDeployed": true,                                                    │
│    "splitterAddress": "0x1234567890123456789012345678901234567890"              │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Revenue Distribution Flow (After Deployment)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ REVENUE PAYOUT FLOW                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

Step 1: Project Generates Revenue
   └─> Business receives payment from customers
       └─> Revenue accumulates in project's business account

Step 2: Simulate Payout (For Testing)
   └─> web3Service.simulatePayout(contractAddress, "0.1")
       └─> Sends test ETH to splitter contract
           └─> Contract emits PaymentReceived event

Step 3: Investor Checks Available Amount
   └─> Call contract.pendingPayment(investorAddress)
       └─> Returns: 0.06 ETH (60% share of 0.1 ETH)

Step 4: Investor Withdraws
   └─> Investor calls contract.release(investorAddress)
       ├─> Calculate: totalReceived * shares[investor] / totalShares
       ├─> Subtract: released[investor] (already withdrawn)
       ├─> Clamp to: remainingCap (enforce 120% limit)
       ├─> Update: released[investor] += payment
       ├─> Update: totalReleased += payment
       ├─> Transfer: ETH to investor's wallet
       └─> Emit: PaymentReleased(investor, amount)

Step 5: Track Progress
   └─> Monitor: totalReleased vs repaymentCap
       └─> When totalReleased >= repaymentCap:
           └─> Emit CapReached(totalReleased)
           └─> No further distributions allowed
```

---

## Component Responsibilities

```
┌──────────────────────────────────────────────────────────────────────┐
│ Component               │ Responsibility                             │
├─────────────────────────┼────────────────────────────────────────────┤
│ Frontend                │ - Collect investment amount from user      │
│                         │ - Display funding progress                 │
│                         │ - Show contract deployment status          │
│                         │ - Link to Etherscan for verification       │
├─────────────────────────┼────────────────────────────────────────────┤
│ investment.controller   │ - Handle HTTP requests                     │
│                         │ - Extract JWT token                        │
│                         │ - Validate request body                    │
│                         │ - Format response                          │
├─────────────────────────┼────────────────────────────────────────────┤
│ investment.service      │ - Business logic for investments           │
│                         │ - Update project funding metrics           │
│                         │ - Detect funding goal completion           │
│                         │ - Trigger contract deployment              │
│                         │ - Handle deployment errors gracefully      │
├─────────────────────────┼────────────────────────────────────────────┤
│ web3.service            │ - Interface to blockchain                  │
│                         │ - Prepare deployment arguments             │
│                         │ - Execute Hardhat script                   │
│                         │ - Parse contract address                   │
│                         │ - Simulate payouts for testing             │
├─────────────────────────┼────────────────────────────────────────────┤
│ deploy.js (Hardhat)     │ - Parse CLI arguments                      │
│                         │ - Validate Ethereum addresses              │
│                         │ - Deploy VeriFundSplitter contract         │
│                         │ - Output contract address to stdout        │
├─────────────────────────┼────────────────────────────────────────────┤
│ VeriFundSplitter.sol    │ - Store investor shares on-chain           │
│                         │ - Accept revenue payments                  │
│                         │ - Calculate proportional distributions     │
│                         │ - Enforce repayment cap                    │
│                         │ - Enable investor withdrawals              │
│                         │ - Emit events for tracking                 │
├─────────────────────────┼────────────────────────────────────────────┤
│ MongoDB                 │ - Store project metadata                   │
│                         │ - Track investments                        │
│                         │ - Save contract address                    │
│                         │ - Update project status                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Error Scenario               │ Handling Strategy                        │
├──────────────────────────────┼──────────────────────────────────────────┤
│ User has no wallet address   │ - Deployment fails gracefully            │
│                              │ - Investment still recorded              │
│                              │ - Project stays in "Funding" status      │
│                              │ - Admin can manually deploy later        │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Insufficient deployer funds  │ - Error caught in web3.service           │
│                              │ - Clear error message returned           │
│                              │ - Investment recorded                    │
│                              │ - Manual deployment endpoint available   │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Network timeout              │ - Hardhat execution times out (120s)     │
│                              │ - Deployment marked as failed            │
│                              │ - Investment still saved                 │
│                              │ - Retry mechanism available              │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Invalid shares calculation   │ - PREVENTED by adjustment logic          │
│                              │ - Largest share adjusted to ensure       │
│                              │   sum = exactly 10000                    │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Duplicate investor addresses │ - PREVENTED by Map grouping              │
│                              │ - Investments summed per unique wallet   │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Contract deployment fails    │ - Error logged with full context         │
│                              │ - Response indicates deployment failed   │
│                              │ - Project can be manually deployed       │
│                              │ - Investment data preserved              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Measures

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer                 │ Security Measure                               │
├───────────────────────┼────────────────────────────────────────────────┤
│ API                   │ - JWT authentication required                  │
│                       │ - Role-based access control                    │
│                       │ - Input validation                             │
│                       │ - Rate limiting (recommended)                  │
├───────────────────────┼────────────────────────────────────────────────┤
│ Business Logic        │ - Prevent creator self-investment              │
│                       │ - Validate funding doesn't exceed goal         │
│                       │ - Check project status before accepting        │
│                       │ - Atomic database operations                   │
├───────────────────────┼────────────────────────────────────────────────┤
│ Web3 Service          │ - Address validation (ethers.isAddress)        │
│                       │ - Share calculation verification               │
│                       │ - Command injection prevention                 │
│                       │ - Timeout protection                           │
├───────────────────────┼────────────────────────────────────────────────┤
│ Smart Contract        │ - Ownable (creator controls)                   │
│                       │ - Pausable (emergency freeze)                  │
│                       │ - ReentrancyGuard                              │
│                       │ - Pull-over-push withdrawal                    │
│                       │ - Checks-Effects-Interactions pattern          │
│                       │ - Repayment cap enforcement                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Operation                     │ Time         │ Notes                    │
├───────────────────────────────┼──────────────┼──────────────────────────┤
│ Investment API call           │ 50-200ms     │ Database write           │
│ Funding goal check            │ < 1ms        │ In-memory calculation    │
│ Fetch investments (populate)  │ 10-50ms      │ MongoDB query with join  │
│ Share calculation             │ < 1ms        │ Array operations         │
│ Hardhat script execution      │ 20-60s       │ Network-dependent        │
│ Contract deployment           │ 15-45s       │ Sepolia block time       │
│ Database update (address)     │ 10-30ms      │ Single document update   │
│ Total (goal-reaching invest)  │ 30-90s       │ Most time in deployment  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Log Point                      │ Information Captured                  │
├────────────────────────────────┼───────────────────────────────────────┤
│ Investment received            │ - Amount, investor ID, project ID     │
│ Funding goal reached           │ - Project title, total raised         │
│ Deployment started             │ - Investor count, shares array        │
│ Hardhat command constructed    │ - Full command with arguments         │
│ Deployment in progress         │ - Status updates                      │
│ Contract deployed              │ - Contract address, block number      │
│ Deployment failed              │ - Error message, stack trace          │
│ Project status updated         │ - Old status → new status             │
│ Database saved                 │ - Project ID, contract address        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Example Log Output:**
```
Investment added to project: ₹60000 by investor 673abc...
Project funding: ₹100000 / ₹100000
Funding check: isFunded=true, hasNoSplitter=true
🎉 Funding goal reached! Deploying splitter contract...

🚀 Starting smart contract deployment for project: Revolutionary AI Startup
📊 Total investments: 2
💰 Total raised: ₹100000
👥 Unique investors: 2
📈 Shares (basis points): [ 6000, 4000 ]
✓ Shares sum: 10000 (must be 10000)
🎯 Repayment cap: ₹120000 (~0.6000 ETH)

📝 Executing deployment command...
   Owner: 0x1234567890123456789012345678901234567890
   Payees: 2
   Network: Sepolia

✅ Contract deployed successfully!
📍 Contract address: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
🔗 View on Etherscan: https://sepolia.etherscan.io/address/0xabcdef...
```

---

## Data Flow Summary

```
Investment Request
   ↓
Validate & Save Investment
   ↓
Update Project Funding
   ↓
Check: Funding Goal Reached?
   ├─ No → Return success (normal investment)
   └─ Yes → Continue to deployment
       ↓
   Fetch All Investments (populate investor wallets)
       ↓
   Calculate Shares (basis points)
       ↓
   Build Hardhat Command
       ↓
   Execute Deploy Script
       ↓
   Parse Contract Address
       ↓
   Save to Project Document
       ↓
   Update Status to "Live"
       ↓
   Return Success + Contract Address
```

---

**Architecture Version**: 1.0  
**Last Updated**: October 14, 2025  
**Status**: ✅ Fully Implemented & Tested
