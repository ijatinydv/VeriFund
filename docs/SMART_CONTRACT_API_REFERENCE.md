# Smart Contract API Reference

Quick reference for all smart contract deployment and payout endpoints.

---

## Investment Endpoints

### Create Investment

**Endpoint:** `POST /api/investments/:projectId`

**Description:** Record an investment. Automatically deploys splitter contract when funding goal is reached.

**Headers:**
```
Authorization: Bearer <investor_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50000
}
```

**Response (Goal Not Reached):**
```json
{
  "success": true,
  "message": "Investment successful",
  "investment": {
    "_id": "67...",
    "investor": "67...",
    "project": "67...",
    "amountInr": 50000,
    "sharePercent": 50,
    "status": "Confirmed"
  },
  "project": {
    "_id": "67...",
    "currentFundingInr": 50000,
    "fundingGoalInr": 100000,
    "status": "Funding"
  },
  "splitterDeployed": false,
  "fundingProgress": 50
}
```

**Response (Goal Reached - Auto Deployment):**
```json
{
  "success": true,
  "message": "Investment successful! Funding goal reached and splitter contract deployed.",
  "investment": {
    "_id": "67...",
    "amountInr": 50000,
    "sharePercent": 50
  },
  "project": {
    "_id": "67...",
    "currentFundingInr": 100000,
    "fundingGoalInr": 100000,
    "status": "Live",
    "splitterContractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
  },
  "splitterDeployed": true,
  "splitterAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
}
```

**Response (Deployment Failed):**
```json
{
  "success": true,
  "message": "Investment successful, but splitter deployment failed. Manual deployment required.",
  "investment": { ... },
  "project": {
    "status": "Funding"
  },
  "splitterDeployed": false,
  "error": "Insufficient funds in deployer wallet. Please add ETH to the deployment wallet."
}
```

**Error Responses:**

```json
// 400 - Validation Error
{
  "success": false,
  "message": "Minimum investment amount is ₹1,000"
}

// 400 - Exceeds Goal
{
  "success": false,
  "message": "Investment would exceed funding goal. Available: ₹50,000"
}

// 400 - Project Not Funding
{
  "success": false,
  "message": "This project is no longer accepting investments. Current status: Live"
}

// 403 - Creator Self-Investment
{
  "success": false,
  "message": "Creators cannot invest in their own project"
}

// 404 - Not Found
{
  "success": false,
  "message": "Project not found"
}
```

---

### Manual Splitter Deployment

**Endpoint:** `POST /api/investments/deploy-splitter/:projectId`

**Description:** Manually trigger splitter contract deployment for a funded project.

**Use Case:** When automatic deployment fails or for admin intervention.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Splitter contract deployed successfully",
  "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "project": {
    "_id": "67...",
    "title": "AI Healthcare Platform",
    "status": "Live",
    "splitterContractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "currentFundingInr": 100000,
    "fundingGoalInr": 100000
  }
}
```

**Error Responses:**

```json
// 400 - Already Deployed
{
  "success": false,
  "message": "Splitter contract already deployed"
}

// 400 - Goal Not Reached
{
  "success": false,
  "message": "Funding goal not yet reached"
}

// 400 - No Investments
{
  "success": false,
  "message": "No investments found for this project"
}

// 404 - Project Not Found
{
  "success": false,
  "message": "Project not found"
}

// 500 - Deployment Error
{
  "success": false,
  "message": "Failed to manually deploy splitter: insufficient funds in deployer wallet"
}
```

---

## Payout Endpoints

### Simulate Revenue Payout

**Endpoint:** `POST /api/projects/:projectId/simulate-payout`

**Description:** Send test ETH to a project's splitter contract to simulate revenue distribution.

**Use Case:** Testing, demonstrating investor payouts, development.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": "0.5"
}
```

**Amount Format:** String representing ETH amount (e.g., "0.5" = 0.5 ETH)

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully sent 0.5 ETH to splitter contract",
  "data": {
    "success": true,
    "transactionHash": "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "blockNumber": 5432109,
    "gasUsed": "21000",
    "amountSent": "0.5",
    "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "from": "0x1234567890123456789012345678901234567890",
    "network": "sepolia",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0xabcd1234...",
    "project": {
      "id": "67...",
      "title": "AI Healthcare Platform",
      "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
    }
  }
}
```

**Error Responses:**

```json
// 400 - Invalid Amount
{
  "success": false,
  "message": "Invalid amount. Must be a positive number."
}

// 400 - Insufficient Balance
{
  "success": false,
  "message": "Insufficient balance. Have 0.3 ETH, need 0.5 ETH"
}

// 400 - No Contract
{
  "success": false,
  "message": "Project does not have a deployed splitter contract"
}

// 404 - Project Not Found
{
  "success": false,
  "message": "Project not found"
}

// 500 - Transaction Failed
{
  "success": false,
  "message": "Failed to simulate payout: transaction reverted"
}
```

---

## Project Query Endpoints

### Get Project with Contract Info

**Endpoint:** `GET /api/projects/:projectId`

**Description:** Get project details including deployed contract address.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67...",
    "title": "AI Healthcare Platform",
    "status": "Live",
    "currentFundingInr": 100000,
    "fundingGoalInr": 100000,
    "splitterContractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "nftContractAddress": null,
    "creator": {
      "_id": "67...",
      "walletAddress": "0x1234...",
      "name": "John Doe"
    },
    "investorCount": 3,
    "createdAt": "2025-10-14T10:00:00.000Z"
  }
}
```

**Contract Info:**
- `splitterContractAddress`: Deployed splitter contract (null if not deployed)
- `nftContractAddress`: Security token contract (future feature)

---

### Get Project Investments

**Endpoint:** `GET /api/investments/project/:projectId`

**Description:** Get all investments for a project (includes investor wallet addresses).

**Response:**
```json
{
  "success": true,
  "data": {
    "investments": [
      {
        "_id": "67...",
        "investor": {
          "_id": "67...",
          "walletAddress": "0xabcd...",
          "name": "Alice"
        },
        "amountInr": 60000,
        "sharePercent": 60,
        "transactionHash": "0x1234...",
        "status": "Confirmed",
        "createdAt": "2025-10-14T10:00:00.000Z"
      },
      {
        "_id": "67...",
        "investor": {
          "_id": "67...",
          "walletAddress": "0xef01...",
          "name": "Bob"
        },
        "amountInr": 40000,
        "sharePercent": 40,
        "transactionHash": "0x5678...",
        "status": "Confirmed",
        "createdAt": "2025-10-14T10:05:00.000Z"
      }
    ],
    "total": 2,
    "totalInvested": 100000
  }
}
```

**Use Case:** Display investor list with wallet addresses for contract interaction.

---

## Web3 Utility Endpoints

### Check Deployer Wallet Balance

Not currently exposed as an endpoint, but can be added:

**Suggested Endpoint:** `GET /api/admin/wallet/balance`

**Implementation:**
```javascript
async getWalletBalance(req, res) {
  const balance = await web3Service.getWalletBalance();
  return res.json({
    success: true,
    balance: balance,
    address: web3Service.wallet.address,
    network: 'sepolia'
  });
}
```

---

## Smart Contract Interaction (Frontend)

### Read Contract Data

```javascript
// Using ethers.js in frontend
import { ethers } from 'ethers';

const SPLITTER_ABI = [
  "function totalShares() view returns (uint256)",
  "function totalReleased() view returns (uint256)",
  "function repaymentCap() view returns (uint256)",
  "function remainingCap() view returns (uint256)",
  "function shares(address) view returns (uint256)",
  "function released(address) view returns (uint256)",
  "function pendingPayment(address) view returns (uint256)",
  "function payees(uint256) view returns (address)",
  "function payeesCount() view returns (uint256)"
];

// Connect to contract (read-only)
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(contractAddress, SPLITTER_ABI, provider);

// Get pending payment for current user
const userAddress = await provider.getSigner().getAddress();
const pending = await contract.pendingPayment(userAddress);
console.log('Pending:', ethers.formatEther(pending), 'ETH');

// Get total distributed
const totalReleased = await contract.totalReleased();
console.log('Total Released:', ethers.formatEther(totalReleased), 'ETH');

// Get remaining cap
const remaining = await contract.remainingCap();
console.log('Remaining Cap:', ethers.formatEther(remaining), 'ETH');
```

### Withdraw Share (Investor)

```javascript
// Using ethers.js in frontend
const SPLITTER_ABI = [
  "function release(address payable account) public",
  "function pendingPayment(address) view returns (uint256)"
];

// Connect with signer (to write)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(contractAddress, SPLITTER_ABI, signer);

// Check pending payment first
const userAddress = await signer.getAddress();
const pending = await contract.pendingPayment(userAddress);

if (pending > 0) {
  // Withdraw
  const tx = await contract.release(userAddress);
  console.log('Transaction sent:', tx.hash);
  
  // Wait for confirmation
  const receipt = await tx.wait();
  console.log('Withdrawn!', ethers.formatEther(pending), 'ETH');
} else {
  console.log('No pending payment');
}
```

---

## WebSocket Events (Future)

Potential real-time events for contract deployment:

```javascript
// Client-side
socket.on('contract:deploying', (data) => {
  console.log('Deploying contract for project:', data.projectId);
  // Show loading spinner
});

socket.on('contract:deployed', (data) => {
  console.log('Contract deployed:', data.contractAddress);
  // Update UI with contract address
  // Show success message
});

socket.on('contract:deployment-failed', (data) => {
  console.error('Deployment failed:', data.error);
  // Show error message
  // Offer manual deployment option
});

socket.on('payout:received', (data) => {
  console.log('Revenue received:', data.amount, 'ETH');
  // Update pending payment display
  // Notify user
});
```

---

## Rate Limits & Quotas

**Current:** No rate limits (development)

**Recommended for Production:**

- **Investment Creation:** 10 per user per hour
- **Manual Deployment:** 3 per admin per hour
- **Payout Simulation:** 5 per admin per hour (costs real ETH!)

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Provide valid auth token |
| 403 | Forbidden | Check user role/permissions |
| 404 | Not Found | Verify resource ID |
| 500 | Server Error | Check logs, retry |
| 503 | Service Unavailable | Network/blockchain issue |

---

## Testing with cURL

### Create Investment
```bash
curl -X POST http://localhost:5000/api/investments/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'
```

### Manual Deployment
```bash
curl -X POST http://localhost:5000/api/investments/deploy-splitter/PROJECT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Simulate Payout
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/simulate-payout \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": "0.5"}'
```

### Get Project
```bash
curl http://localhost:5000/api/projects/PROJECT_ID
```

---

## Testing with Postman

Import this collection:

```json
{
  "info": {
    "name": "VeriFund Smart Contract API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Investment",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{investorToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 50000\n}"
        },
        "url": "{{baseUrl}}/api/investments/{{projectId}}"
      }
    },
    {
      "name": "Manual Deploy",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{adminToken}}" }
        ],
        "url": "{{baseUrl}}/api/investments/deploy-splitter/{{projectId}}"
      }
    },
    {
      "name": "Simulate Payout",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{adminToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": \"0.5\"\n}"
        },
        "url": "{{baseUrl}}/api/projects/{{projectId}}/simulate-payout"
      }
    }
  ],
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:5000" },
    { "key": "projectId", "value": "" },
    { "key": "investorToken", "value": "" },
    { "key": "adminToken", "value": "" }
  ]
}
```

---

**Version:** 1.0  
**Last Updated:** October 14, 2025  
**Blockchain:** Sepolia Testnet
