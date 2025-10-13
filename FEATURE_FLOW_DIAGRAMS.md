# 📊 Feature Flow Diagrams

## Visual Guide to AI Price Suggestion & Investment Flow

---

## 🤖 Feature 1: AI Price Suggestion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATOR JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Creator     │
│  starts      │──────┐
│  creating    │      │
│  project     │      │
└──────────────┘      │
                      ▼
           ┌─────────────────────┐
           │ Step 1: Project     │
           │ Details Form        │
           └─────────────────────┘
                      │
                      │ Fills:
                      │ • Title
                      │ • Description
                      │ • Category
                      ▼
           ┌─────────────────────┐
           │ Clicks "Get AI      │
           │ Price Suggestion"   │
           └─────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Frontend (TanStack Query)   │
           │ • Shows loading spinner     │
           │ • Disables button           │
           │ • Button text: "Analyzing..." │
           └─────────────────────────────┘
                      │
                      │ POST /api/projects/suggest-price
                      │ {
                      │   title: "...",
                      │   description: "...",
                      │   category: "Finance",
                      │   fundingDuration: 30
                      │ }
                      ▼
           ┌─────────────────────────────┐
           │ Backend API                 │
           │ • Analyzes project data     │
           │ • Applies category multiplier│
           │ • Applies complexity factor │
           │ • Applies duration factor   │
           │ • Calculates min/max range │
           └─────────────────────────────┘
                      │
                      │ Returns:
                      │ {
                      │   suggestedPrice: 500000,
                      │   minPrice: 300000,
                      │   maxPrice: 700000,
                      │   confidence: 0.85
                      │ }
                      ▼
           ┌─────────────────────────────┐
           │ Frontend Receives Response  │
           │ • onSuccess callback fires  │
           │ • setPriceSuggestion(data)  │
           │ • Toast: "AI price          │
           │   suggestion generated!"    │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────────────┐
           │ UI Updates                          │
           │ ┌─────────────────────────────────┐ │
           │ │ 💡 AI-Powered Suggestion        │ │
           │ │                                 │ │
           │ │ Based on your project details:  │ │
           │ │                                 │ │
           │ │ [Min: ₹3,00,000]               │ │
           │ │ [Recommended: ₹5,00,000]       │ │
           │ │ [Max: ₹7,00,000]               │ │
           │ │                                 │ │
           │ │ 💡 Click any amount to apply    │ │
           │ └─────────────────────────────────┘ │
           └─────────────────────────────────────┘
                      │
                      │ Creator clicks
                      │ "Recommended" chip
                      ▼
           ┌─────────────────────────────┐
           │ Apply Price Action          │
           │ • setFormData({             │
           │     fundingGoalInr: 500000  │
           │   })                        │
           │ • Toast: "Suggested price   │
           │   applied!"                 │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Funding Goal field updated  │
           │ Value: ₹5,00,000           │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Creator continues with      │
           │ project creation            │
           └─────────────────────────────┘
```

---

## 💰 Feature 2: End-to-End Investment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVESTOR JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Investor    │
│  browses     │──────┐
│  projects    │      │
└──────────────┘      │
                      ▼
           ┌─────────────────────┐
           │ Project Detail Page │
           │ • Title             │
           │ • Description       │
           │ • Funding goal      │
           │ • Amount raised     │
           └─────────────────────┘
                      │
                      │ Clicks "Invest Now"
                      ▼
           ┌─────────────────────────────┐
           │ InvestModal Opens           │
           │ ┌─────────────────────────┐ │
           │ │ Fund Project            │ │
           │ │ Project Title           │ │
           │ │                         │ │
           │ │ Amount: [____] ETH     │ │
           │ │                         │ │
           │ │ Contract: 0x123...      │ │
           │ │                         │ │
           │ │ [Cancel] [Confirm]     │ │
           │ └─────────────────────────┘ │
           └─────────────────────────────┘
                      │
                      │ Enters amount: 0.5 ETH
                      │ Clicks "Confirm Investment"
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEB3 TRANSACTION FLOW                        │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Frontend Validation         │
           │ • Check amount > 0          │
           │ • Check contract address    │
           │ • parseEther("0.5")         │
           │   = 500000000000000000 Wei  │
           └─────────────────────────────┘
                      │
                      │ sendTransaction({
                      │   to: project.splitterContractAddress,
                      │   value: parseEther("0.5")
                      │ })
                      ▼
           ┌─────────────────────────────┐
           │ Wagmi useSendTransaction    │
           │ • isPending = true          │
           │ • Button: "Confirm in       │
           │   Wallet..." with spinner   │
           │ • Toast: "Preparing         │
           │   transaction..."           │
           └─────────────────────────────┘
                      │
                      │ Triggers MetaMask
                      ▼
           ┌─────────────────────────────┐
           │ MetaMask Popup              │
           │ ┌─────────────────────────┐ │
           │ │ Transaction Request     │ │
           │ │                         │ │
           │ │ To: 0x123...           │ │
           │ │ Value: 0.5 ETH         │ │
           │ │ Gas: ~0.0001 ETH       │ │
           │ │                         │ │
           │ │ [Reject] [Confirm]     │ │
           │ └─────────────────────────┘ │
           └─────────────────────────────┘
                      │
                      │ User clicks "Confirm"
                      ▼
           ┌─────────────────────────────┐
           │ Transaction Sent            │
           │ • Hash generated            │
           │ • isPending = false         │
           │ • hash = "0xabc123..."      │
           └─────────────────────────────┘
                      │
                      │ useWaitForTransactionReceipt
                      ▼
           ┌─────────────────────────────┐
           │ Waiting for Confirmation    │
           │ ┌─────────────────────────┐ │
           │ │ ⏳ Waiting for          │ │
           │ │    confirmation...       │ │
           │ │                         │ │
           │ │ Your transaction is     │ │
           │ │ being processed         │ │
           │ │                         │ │
           │ │ Tx: 0xabc123...        │ │
           │ └─────────────────────────┘ │
           │ • isConfirming = true       │
           └─────────────────────────────┘
                      │
                      │ Miners process transaction
                      │ (~15-30 seconds on Sepolia)
                      ▼
           ┌─────────────────────────────┐
           │ Blockchain Confirmed        │
           │ • isConfirmed = true        │
           │ • Transaction mined         │
           │ • Receipt available         │
           └─────────────────────────────┘
                      │
                      │ useEffect detects:
                      │ isConfirmed && hash
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND RECORDING FLOW                         │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Auto-trigger Backend Mutation│
           │ • recordInvestmentMutation   │
           │   .mutate({                 │
           │     projectId: "...",       │
           │     amount: 0.5,            │
           │     transactionHash: hash,  │
           │     currency: "ETH"         │
           │   })                        │
           └─────────────────────────────┘
                      │
                      │ UI Updates:
                      │ ┌─────────────────────────┐
                      │ │ ℹ Recording your       │
                      │ │   investment...         │
                      │ │                         │
                      │ │ Please wait while we    │
                      │ │ save to database        │
                      │ └─────────────────────────┘
                      ▼
           ┌─────────────────────────────┐
           │ POST /api/investments       │
           │ Headers:                    │
           │   Authorization: Bearer ... │
           │ Body:                       │
           │ {                           │
           │   projectId: "...",         │
           │   amount: 0.5,              │
           │   transactionHash: "0x...", │
           │   currency: "ETH"           │
           │ }                           │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Backend Investment Controller│
           │ • Extract user from JWT     │
           │ • Validate project exists   │
           │ • Create investment record  │
           │ • Update project stats      │
           │ • Save to MongoDB           │
           └─────────────────────────────┘
                      │
                      │ Returns:
                      │ {
                      │   success: true,
                      │   data: {
                      │     investment: {
                      │       _id: "...",
                      │       projectId: "...",
                      │       investorId: "...",
                      │       amount: 0.5,
                      │       transactionHash: "0x...",
                      │       status: "confirmed"
                      │     }
                      │   }
                      │ }
                      ▼
           ┌─────────────────────────────┐
           │ Frontend onSuccess Callback │
           │ • setInvestmentRecorded(true)│
           │ • Invalidate queries:       │
           │   - ['project', projectId]  │
           │   - ['projects']            │
           │   - ['myInvestments']       │
           │ • Toast: "🎉 Investment     │
           │   recorded successfully!"   │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────────────┐
           │ Success UI                          │
           │ ┌─────────────────────────────────┐ │
           │ │ ✅ Investment Successful! 🎉    │ │
           │ │                                 │ │
           │ │ Your transaction has been       │ │
           │ │ confirmed and recorded          │ │
           │ │                                 │ │
           │ │ Amount: 0.5 ETH                │ │
           │ │                                 │ │
           │ │ View on Etherscan →            │ │
           │ │                                 │ │
           │ │           [Close]              │ │
           │ └─────────────────────────────────┘ │
           └─────────────────────────────────────┘
                      │
                      │ Click "Close"
                      ▼
           ┌─────────────────────────────┐
           │ Modal Closes & Resets       │
           │ • setAmount('')             │
           │ • setInvestmentRecorded(false)│
           │ • resetTransaction()        │
           │ • onClose()                 │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Project Page Refreshes      │
           │ • Query invalidation        │
           │   triggers refetch          │
           │ • Amount Raised updated     │
           │ • Investment count updated  │
           │ • Progress bar updates      │
           └─────────────────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ Investor Dashboard Updates  │
           │ • New investment appears in │
           │   "My Investments" list     │
           │ • Portfolio value updated   │
           └─────────────────────────────┘
```

---

## 🔄 State Flow Comparison

### AI Price Suggestion States

```
IDLE → LOADING → SUCCESS → APPLIED
  ↓       ↓         ↓         ↓
  ●       ⏳        ✅        ✓

IDLE: Button enabled, no suggestion shown
LOADING: Button disabled, "Analyzing...", spinner visible
SUCCESS: Alert with prices shown, chips clickable
APPLIED: Price populated in funding goal field
ERROR: Error toast, button returns to IDLE
```

### Investment Flow States

```
IDLE → VALIDATING → PENDING → CONFIRMING → RECORDING → SUCCESS
  ↓        ↓           ↓          ↓            ↓           ↓
  ●        ●           ⏳         ⏳           ⏳          ✅

IDLE: Amount field empty, button enabled
VALIDATING: Check amount > 0, contract exists
PENDING: MetaMask popup, "Confirm in Wallet..."
CONFIRMING: Waiting for blockchain, "Processing..."
RECORDING: Saving to backend, "Recording..."
SUCCESS: Green alert, Etherscan link, "Close" button
ERROR: Red alert, error message, button returns to IDLE
```

---

## 📡 API Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ↔ BACKEND                           │
└─────────────────────────────────────────────────────────────────┘

AI Price Suggestion:
┌──────────────┐  POST /api/projects/suggest-price   ┌───────────┐
│   Frontend   │ ────────────────────────────────────▶│  Backend  │
│  Component   │                                      │    API    │
│              │ ◀────────────────────────────────────│           │
└──────────────┘  { suggestedPrice, minPrice, ... }  └───────────┘

Investment Recording:
┌──────────────┐  POST /api/investments              ┌───────────┐
│   Frontend   │ ────────────────────────────────────▶│  Backend  │
│  Component   │                                      │    API    │
│              │ ◀────────────────────────────────────│           │
└──────────────┘  { success, data: investment }      └───────────┘

Query Invalidation:
┌──────────────┐  Invalidate ['project', id]         ┌───────────┐
│  TanStack    │ ────────────────────────────────────▶│  Refetch  │
│   Query      │                                      │   Data    │
└──────────────┘                                      └───────────┘
```

---

## 🔐 Security Flow

```
Authentication Flow:
┌──────────────┐
│ User Action  │
└──────────────┘
      │
      ▼
┌──────────────────────────┐
│ JWT Token in localStorage│
└──────────────────────────┘
      │
      ▼ Axios interceptor adds
┌──────────────────────────┐
│ Authorization: Bearer ... │
└──────────────────────────┘
      │
      ▼ Backend validates
┌──────────────────────────┐
│ req.user populated       │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Action authorized        │
└──────────────────────────┘

Web3 Transaction Security:
┌──────────────────────────┐
│ MetaMask signature       │
│ required for all txs     │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ User must approve in     │
│ wallet UI                │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Smart contract validates │
│ and executes             │
└──────────────────────────┘
```

---

## 🎯 Key Success Metrics

```
AI Price Suggestion:
├─ Response Time: < 2 seconds
├─ Accuracy: Within 20% of actual funding
├─ Usage Rate: 60%+ of creators use it
└─ Application Rate: 40%+ apply suggestion

Investment Flow:
├─ Transaction Success: > 95%
├─ Recording Success: > 99%
├─ Time to Confirm: < 60 seconds
├─ User Abandonment: < 10%
└─ Error Recovery: 100%
```

---

**Last Updated**: October 13, 2025
**Document Version**: 1.0
**Status**: Production Ready ✅
