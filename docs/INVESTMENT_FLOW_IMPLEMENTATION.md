# Investment & Funding Flow Implementation

## Overview
This document details the complete implementation of the Investment and Funding lifecycle for the VeriFund crowdfunding platform. This implementation enables investors to fund projects, tracks funding progress in real-time, and automatically updates project status when funding goals are met.

## Implementation Date
October 14, 2025

## Architecture Summary

### Backend Layer
- **Controllers**: Handle HTTP requests and validation
- **Services**: Contain core business logic for investment processing
- **Models**: Define data schemas and validation rules
- **Routes**: Map endpoints to controller functions

### Frontend Layer
- **API Service**: Centralized API communication
- **Components**: Reusable UI components (InvestModal)
- **Pages**: Full page views (ProjectDetailPage)
- **State Management**: React Query for server state, local state for UI

---

## Backend Implementation

### 1. Investment Controller (`backend/src/controllers/investment.controller.js`)

#### New Endpoint: `POST /api/investments/:projectId`
This simplified endpoint enables INR-based investments with the project ID in the URL path.

**Features:**
- ✅ Validates investment amount (minimum ₹1,000)
- ✅ Prevents negative or zero amounts
- ✅ Generates transaction hash for INR investments
- ✅ Returns detailed response with funding progress

**Request:**
```json
POST /api/investments/:projectId
{
  "amount": 10000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Investment successful",
  "investment": { /* investment object */ },
  "project": { /* updated project object */ },
  "fundingProgress": 45
}
```

### 2. Investment Service (`backend/src/services/investment.service.js`)

#### Enhanced `createInvestment` Function

**Core Features Implemented:**
1. **Creator Self-Funding Prevention**
   - Compares `project.creator` with `investorId`
   - Returns error: "Creators cannot invest in their own project"

2. **Status-Based Investment Control**
   - Only allows investments when `project.status === 'Funding'`
   - Error message: "This project is no longer accepting investments"

3. **Atomic Project Updates**
   - Updates `currentFundingInr` by adding investment amount
   - Increments `investorCount`
   - Adds investment to `project.investments` array

4. **Automatic Status Transition**
   - When `currentFundingInr >= fundingGoalInr`:
     - Triggers splitter contract deployment
     - Changes `project.status` to 'Live'
     - Records splitter contract address

**Investment Flow:**
```
1. Validate inputs (projectId, investorId, amount, transactionHash)
2. Find project by ID
3. Check project status is 'Funding'
4. Prevent creator self-funding
5. Add investment to project
6. Update funding metrics
7. Create Investment record
8. Check if funding goal met
9. If funded:
   - Deploy splitter contract
   - Update project status to 'Live'
10. Return success response
```

### 3. Project Model (`backend/src/models/Project.model.js`)

#### Default Status Change
```javascript
status: {
  type: String,
  default: 'Funding',  // Changed from 'Pending'
  enum: ['Pending', 'Funding', 'Live', 'Completed', 'Cancelled']
}
```

**Impact:**
- New projects are immediately open for investment
- No manual status change required by creators
- Streamlined project creation flow

### 4. Investment Routes (`backend/src/routes/investment.routes.js`)

#### New Route
```javascript
/**
 * @route   POST /api/investments/:projectId
 * @desc    Create a new investment with projectId in URL (simplified INR-based flow)
 * @access  Protected - Investor only
 */
router.post('/:projectId', authenticate, investmentController.createInvestmentByProjectId);
```

---

## Frontend Implementation

### 1. API Service (`frontend/src/services/api.js`)

#### New Function: `investInProject`
```javascript
/**
 * Invest in a specific project (simplified INR-based flow)
 * @param {string} projectId - The project ID
 * @param {number} amount - Investment amount in INR
 * @returns {Promise} - Promise resolving to investment record
 */
export const investInProject = async (projectId, amount) => {
  const response = await api.post(`/investments/${projectId}`, { amount });
  return response;
};
```

### 2. InvestModal Component (`frontend/src/components/ui/InvestModal.jsx`)

#### Dual-Mode Investment System

**Investment Modes:**
1. **INR Mode (Primary)** - Simplified fiat investment
2. **ETH Mode** - Web3 blockchain investment

#### New Props:
- `onSuccess` - Callback function to refresh parent component data

#### Key Features:

**1. Investment Mode Toggle**
```jsx
<ToggleButtonGroup value={investmentMode} onChange={...}>
  <ToggleButton value="INR">
    <CurrencyRupeeIcon /> INR (Fiat)
  </ToggleButton>
  <ToggleButton value="ETH">
    <AccountBalanceWalletIcon /> ETH (Crypto)
  </ToggleButton>
</ToggleButtonGroup>
```

**2. INR Investment Mutation**
```javascript
const inrInvestmentMutation = useMutation({
  mutationFn: ({ projectId, amount }) => investInProject(projectId, amount),
  onSuccess: () => {
    setInvestmentRecorded(true);
    queryClient.invalidateQueries(['project', 'projects', 'myInvestments']);
    toast.success('🎉 Investment successful!');
    if (onSuccess) onSuccess(); // Refresh parent data
  }
});
```

**3. Enhanced Validation**
- Minimum INR investment: ₹1,000
- Positive amount check
- Mode-specific validation rules

**4. Dynamic UI Elements**
- Currency symbol changes (₹ / ETH)
- Different placeholders per mode
- Conditional contract address display (ETH only)
- Mode-specific help text

### 3. ProjectDetailPage (`frontend/src/pages/ProjectDetailPage.jsx`)

#### Dynamic UI Updates

**1. Refetch Function**
```javascript
const {
  data: project,
  refetch: fetchProject, // Exposed for refreshing data
} = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => fetchProjectById(projectId),
});
```

**2. Status-Based Button Control**
```jsx
<Button
  onClick={handleInvestClick}
  disabled={project.status !== 'Funding'}
>
  {project.status === 'Funding' 
    ? 'Invest Now' 
    : project.status === 'Live' || project.status === 'Funded'
    ? 'Fully Funded'
    : `Funding ${project.status}`}
</Button>
```

**3. Pass onSuccess Callback**
```jsx
<InvestModal
  open={investModalOpen}
  onClose={() => setInvestModalOpen(false)}
  onSuccess={fetchProject}  // Refresh on investment success
  project={project}
/>
```

**4. Correct Field Names**
Updated to use backend schema field names:
- `fundingGoalInr` (was `fundingGoal`)
- `currentFundingInr` (was `currentFunding`)

---

## Investment Flow - End to End

### User Journey

1. **Browse Projects**
   - User navigates to Browse page
   - Sees list of projects with status 'Funding'

2. **View Project Details**
   - Clicks on a project
   - Sees funding progress bar
   - "Invest Now" button is enabled (status === 'Funding')

3. **Open Investment Modal**
   - Clicks "Invest Now"
   - Modal opens with INR mode selected by default

4. **Enter Investment Amount**
   - Enters amount (e.g., ₹10,000)
   - System validates minimum ₹1,000

5. **Submit Investment**
   - Clicks "Confirm Investment"
   - API call: `POST /api/investments/:projectId`

6. **Backend Processing**
   ```
   ✓ Validate amount
   ✓ Check project status
   ✓ Prevent creator self-funding
   ✓ Create Investment record
   ✓ Update project.currentFundingInr
   ✓ Increment project.investorCount
   ✓ Check if funding goal met
   ```

7. **If Funding Goal Met:**
   ```
   ✓ Deploy splitter contract
   ✓ Update project.splitterContractAddress
   ✓ Change project.status to 'Live'
   ```

8. **Success Response**
   - Toast notification: "🎉 Investment successful!"
   - Modal shows success state
   - Parent component refreshes (fetchProject)

9. **UI Updates**
   - Progress bar advances
   - Current funding amount increases
   - If fully funded:
     - Button text changes to "Fully Funded"
     - Button becomes disabled
     - Status badge changes to "Live"

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (User Action)                   │
├─────────────────────────────────────────────────────────────┤
│  1. User clicks "Invest Now"                                │
│  2. InvestModal opens with INR mode                         │
│  3. User enters ₹10,000                                     │
│  4. User clicks "Confirm Investment"                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (frontend/src/services/api.js)        │
├─────────────────────────────────────────────────────────────┤
│  investInProject(projectId, 10000)                          │
│  → POST /api/investments/:projectId                         │
│  → { amount: 10000 }                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend Router (investment.routes.js)                │
├─────────────────────────────────────────────────────────────┤
│  POST /:projectId                                           │
│  → authenticate middleware                                  │
│  → investmentController.createInvestmentByProjectId         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│      Investment Controller (investment.controller.js)        │
├─────────────────────────────────────────────────────────────┤
│  1. Extract projectId from params                           │
│  2. Extract amount from body                                │
│  3. Get investorId from req.user.userId                     │
│  4. Validate amount > 0                                     │
│  5. Generate transactionHash                                │
│  6. Call investmentService.createInvestment()               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│       Investment Service (investment.service.js)             │
├─────────────────────────────────────────────────────────────┤
│  1. Find project by ID                                      │
│  2. ✓ project.status === 'Funding'                         │
│  3. ✓ project.creator !== investorId                       │
│  4. ✓ amount >= 1000                                       │
│  5. Add to project.investments array                        │
│  6. project.currentFundingInr += 10000                      │
│  7. project.investorCount += 1                              │
│  8. Create Investment document                              │
│  9. Check: currentFundingInr >= fundingGoalInr?            │
│     YES → Deploy splitter, set status = 'Live'             │
│     NO  → Return success with fundingProgress              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Database (MongoDB)                            │
├─────────────────────────────────────────────────────────────┤
│  Investment Collection:                                      │
│    + New Investment record created                          │
│                                                             │
│  Project Collection:                                         │
│    + currentFundingInr updated                              │
│    + investorCount incremented                              │
│    + status changed (if goal met)                           │
│    + splitterContractAddress set (if deployed)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Response Back to Frontend                     │
├─────────────────────────────────────────────────────────────┤
│  {                                                          │
│    success: true,                                           │
│    message: "Investment successful",                        │
│    investment: {...},                                       │
│    project: {...},                                          │
│    fundingProgress: 45                                      │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Frontend State Updates (React Query)               │
├─────────────────────────────────────────────────────────────┤
│  1. inrInvestmentMutation.onSuccess()                       │
│  2. queryClient.invalidateQueries(['project'])              │
│  3. queryClient.invalidateQueries(['projects'])             │
│  4. queryClient.invalidateQueries(['myInvestments'])        │
│  5. toast.success('🎉 Investment successful!')             │
│  6. onSuccess() → fetchProject()                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  UI Re-render (Automatic)                    │
├─────────────────────────────────────────────────────────────┤
│  ✓ Progress bar updates (45% → 55%)                        │
│  ✓ Current funding displays ₹55,000                        │
│  ✓ If fully funded:                                        │
│    - Button text: "Fully Funded"                           │
│    - Button disabled                                       │
│    - Status badge: "Live"                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Lifecycle

```
Project Created
    ↓
[Status: Funding] (default)
    ↓
    ├── Investment 1: ₹10,000  → currentFundingInr: ₹10,000
    ├── Investment 2: ₹15,000  → currentFundingInr: ₹25,000
    ├── Investment 3: ₹20,000  → currentFundingInr: ₹45,000
    └── Investment 4: ₹5,000   → currentFundingInr: ₹50,000
    ↓
currentFundingInr >= fundingGoalInr
    ↓
Deploy Splitter Contract
    ↓
[Status: Live]
    ↓
    • Button text: "Fully Funded"
    • Button disabled
    • No more investments accepted
```

---

## Security Features

### Backend
1. **Authentication Required**: All investment endpoints require valid JWT token
2. **Creator Self-Funding Prevention**: `project.creator !== investorId`
3. **Status Validation**: Only 'Funding' projects accept investments
4. **Amount Validation**: Minimum ₹1,000, positive values only
5. **Overflow Prevention**: Check if investment would exceed goal
6. **Unique Transaction Hash**: Prevents duplicate investment records

### Frontend
1. **Client-Side Validation**: Amount, minimum investment checks
2. **Disabled State Management**: Prevents multiple submissions
3. **Status-Based UI**: Button disabled when not in 'Funding' status
4. **Error Handling**: Comprehensive error messages and toast notifications

---

## Error Handling

### Backend Errors

| Error Scenario | Status Code | Message |
|----------------|-------------|---------|
| Missing amount | 400 | "Investment amount is required" |
| Invalid amount | 400 | "Investment amount must be positive" |
| Project not found | 404 | "Project not found" |
| Wrong status | 400 | "This project is no longer accepting investments" |
| Creator self-funding | 400 | "Creators cannot invest in their own project" |
| Below minimum | 400 | "Minimum investment amount is ₹1,000" |
| Exceeds goal | 400 | "Investment would exceed funding goal" |

### Frontend Error Handling

```javascript
try {
  inrInvestmentMutation.mutate({ projectId, amount });
} catch (error) {
  setError(error.message);
  toast.error(error.message);
}
```

---

## Testing Scenarios

### Test Case 1: Successful Investment
**Given**: Project with status 'Funding', goal ₹100,000, current ₹40,000
**When**: Investor invests ₹10,000
**Then**: 
- Investment record created
- currentFundingInr = ₹50,000
- fundingProgress = 50%
- Success toast displayed
- UI updates automatically

### Test Case 2: Funding Goal Met
**Given**: Project with goal ₹100,000, current ₹95,000
**When**: Investor invests ₹5,000
**Then**:
- currentFundingInr = ₹100,000
- status changes to 'Live'
- Splitter contract deployed
- Button text: "Fully Funded"
- Button disabled

### Test Case 3: Creator Self-Funding
**Given**: Creator views their own project
**When**: Creator tries to invest
**Then**:
- Error: "Creators cannot invest in their own project"
- Investment not recorded
- No project updates

### Test Case 4: Invalid Amount
**Given**: Investment modal open
**When**: User enters ₹500 (below minimum)
**Then**:
- Error: "Minimum investment is ₹1,000"
- Submit button disabled
- No API call made

### Test Case 5: Project Not in Funding Status
**Given**: Project with status 'Live'
**When**: Page loads
**Then**:
- Button text: "Fully Funded"
- Button disabled
- Investment modal cannot be opened

---

## Performance Optimizations

1. **React Query Caching**: 2-minute stale time for project data
2. **Optimistic Updates**: UI feedback before API response
3. **Query Invalidation**: Targeted cache invalidation after investment
4. **Debounced Input**: Prevents excessive validation calls
5. **Lazy Loading**: Modal content loaded only when opened

---

## Future Enhancements

### Phase 2
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Email notifications on investment
- [ ] Investment receipts (PDF generation)
- [ ] Investment history timeline
- [ ] Refund mechanism for cancelled projects

### Phase 3
- [ ] Recurring investments
- [ ] Investment rewards/tiers
- [ ] Social sharing after investment
- [ ] Investment leaderboard
- [ ] Tax documentation (TDS certificates)

---

## API Reference

### Create Investment (Simplified INR Flow)

**Endpoint**: `POST /api/investments/:projectId`

**Authentication**: Required (Bearer token)

**Request:**
```json
{
  "amount": 10000
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Investment successful",
  "investment": {
    "id": "64a8f...",
    "investor": "64a7e...",
    "project": "64a6d...",
    "amountInr": 10000,
    "sharePercent": 10,
    "transactionHash": "0x...",
    "createdAt": "2025-10-14T..."
  },
  "project": {
    "id": "64a6d...",
    "title": "AI Startup",
    "currentFundingInr": 50000,
    "fundingGoalInr": 100000,
    "status": "Funding",
    "investorCount": 5
  },
  "fundingProgress": 50
}
```

**Response (Goal Met):**
```json
{
  "success": true,
  "message": "Investment successful! Funding goal reached and splitter contract deployed.",
  "investment": {...},
  "project": {
    "status": "Live",
    "splitterContractAddress": "0x1234...",
    ...
  },
  "splitterDeployed": true,
  "splitterAddress": "0x1234..."
}
```

**Error Responses:**
```json
// 400 - Invalid amount
{
  "success": false,
  "message": "Investment amount must be positive"
}

// 400 - Creator self-funding
{
  "success": false,
  "message": "Creators cannot invest in their own project"
}

// 400 - Wrong status
{
  "success": false,
  "message": "This project is no longer accepting investments. Current status: Live"
}

// 404 - Project not found
{
  "success": false,
  "message": "Project not found"
}
```

---

## Files Modified

### Backend
1. `backend/src/controllers/investment.controller.js` - Added `createInvestmentByProjectId`
2. `backend/src/services/investment.service.js` - Added creator self-funding check
3. `backend/src/models/Project.model.js` - Changed default status to 'Funding'
4. `backend/src/routes/investment.routes.js` - Added new route

### Frontend
1. `frontend/src/services/api.js` - Added `investInProject` function
2. `frontend/src/components/ui/InvestModal.jsx` - Dual-mode investment with onSuccess
3. `frontend/src/pages/ProjectDetailPage.jsx` - Dynamic UI updates, status-based button

---

## Conclusion

The complete Investment & Funding Flow has been successfully implemented with:

✅ **Robust Backend Logic**: Transaction engine with validation, atomic updates, and auto-deployment
✅ **Dynamic Frontend**: Real-time UI updates based on project status
✅ **Dual Investment Modes**: Support for both INR (fiat) and ETH (crypto) investments
✅ **Security**: Creator self-funding prevention, status validation, authentication
✅ **User Experience**: Toast notifications, loading states, error handling
✅ **Data Integrity**: Atomic database operations, query invalidation, cache management

The system now provides a complete, end-to-end investment lifecycle from project creation to fully funded status, with automatic contract deployment and real-time UI feedback.
