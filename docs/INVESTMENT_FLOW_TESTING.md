# Investment Flow - Testing Guide

## Quick Test Checklist

### Prerequisites
- ✅ Backend server running on `http://localhost:5001`
- ✅ Frontend server running on `http://localhost:5173`
- ✅ MongoDB connected
- ✅ User authenticated with wallet

### Test 1: Basic Investment Flow (INR)
**Objective**: Verify a standard investment succeeds and updates UI

1. **Setup**
   - Login as an investor (not the project creator)
   - Navigate to Browse page

2. **Actions**
   - Click on any project with status "Funding"
   - Verify "Invest Now" button is enabled
   - Click "Invest Now"
   - Modal opens with INR mode selected
   - Enter amount: `10000`
   - Click "Confirm Investment"

3. **Expected Results**
   - ✅ Success toast: "🎉 Investment successful!"
   - ✅ Modal shows success state
   - ✅ Progress bar updates automatically
   - ✅ Current funding amount increases by ₹10,000
   - ✅ Investor count increases by 1
   - ✅ Modal can be closed

### Test 2: Funding Goal Completion
**Objective**: Verify automatic status change when goal is met

1. **Setup**
   - Find a project close to its funding goal
   - Example: Goal ₹100,000, Current ₹95,000

2. **Actions**
   - Login as investor
   - View the project
   - Invest ₹5,000 or more

3. **Expected Results**
   - ✅ Success message includes "Funding goal reached"
   - ✅ Project status changes to "Live"
   - ✅ Button text changes to "Fully Funded"
   - ✅ Button becomes disabled
   - ✅ Splitter contract address appears (if Web3 enabled)
   - ✅ Status badge shows "Live"

### Test 3: Creator Self-Funding Prevention
**Objective**: Ensure creators cannot invest in their own projects

1. **Setup**
   - Login as a creator
   - Create a new project OR navigate to your own project

2. **Actions**
   - Click "Invest Now"
   - Enter amount: `10000`
   - Click "Confirm Investment"

3. **Expected Results**
   - ✅ Error toast: "Creators cannot invest in their own project"
   - ✅ Investment NOT recorded
   - ✅ Project funding unchanged

### Test 4: Minimum Investment Validation
**Objective**: Verify minimum investment amount enforcement

1. **Setup**
   - Login as investor
   - Open any project in "Funding" status

2. **Actions**
   - Click "Invest Now"
   - Select INR mode
   - Enter amount: `500` (below minimum)
   - Click "Confirm Investment"

3. **Expected Results**
   - ✅ Error message: "Minimum investment is ₹1,000"
   - ✅ No API call made
   - ✅ Investment NOT recorded

### Test 5: Closed Project Investment Prevention
**Objective**: Verify investments cannot be made on non-Funding projects

1. **Setup**
   - Navigate to a project with status "Live" or "Completed"

2. **Actions**
   - Observe the investment button

3. **Expected Results**
   - ✅ Button text: "Fully Funded" or "Funding Completed"
   - ✅ Button is disabled
   - ✅ Cannot open investment modal

### Test 6: Dual Mode Investment (ETH)
**Objective**: Verify ETH investment mode works (if Web3 configured)

1. **Setup**
   - Ensure wallet connected (MetaMask)
   - Project has splitter contract deployed

2. **Actions**
   - Click "Invest Now"
   - Toggle to "ETH (Crypto)" mode
   - Enter amount: `0.05` ETH
   - Click "Confirm Investment"
   - Approve transaction in MetaMask

3. **Expected Results**
   - ✅ MetaMask popup appears
   - ✅ Transaction submitted to blockchain
   - ✅ "Waiting for confirmation..." message
   - ✅ Transaction confirms
   - ✅ Investment recorded in backend
   - ✅ UI updates with new funding amount

### Test 7: Real-Time UI Updates
**Objective**: Verify UI refreshes after investment without page reload

1. **Setup**
   - Open project detail page
   - Note current funding amount and progress

2. **Actions**
   - Make an investment
   - Wait for success message
   - Close modal

3. **Expected Results**
   - ✅ No page reload required
   - ✅ Progress bar animates to new percentage
   - ✅ Funding amount updates
   - ✅ Investor count increases
   - ✅ If goal met, button disables immediately

### Test 8: API Response Validation
**Objective**: Verify backend returns correct data structure

1. **Setup**
   - Open browser DevTools → Network tab
   - Open project page

2. **Actions**
   - Make an investment
   - Observe API call: `POST /api/investments/:projectId`

3. **Expected Response**
   ```json
   {
     "success": true,
     "message": "Investment successful",
     "investment": {
       "id": "...",
       "amountInr": 10000,
       "investor": "...",
       "project": "...",
       "sharePercent": ...,
       "transactionHash": "0x...",
       "status": "Confirmed"
     },
     "project": {
       "currentFundingInr": ...,
       "fundingGoalInr": ...,
       "status": "Funding",
       "investorCount": ...
     },
     "fundingProgress": ...
   }
   ```

### Test 9: Multiple Sequential Investments
**Objective**: Verify multiple investments work correctly

1. **Actions**
   - Make investment 1: ₹10,000
   - Wait for success
   - Close modal
   - Click "Invest Now" again
   - Make investment 2: ₹15,000
   - Wait for success

2. **Expected Results**
   - ✅ Both investments recorded
   - ✅ Total funding = sum of both
   - ✅ Investor count increases by 2 (if different investors)
   - ✅ UI updates after each investment

### Test 10: Error Handling
**Objective**: Verify graceful error handling

1. **Scenarios to Test**
   - **No authentication**: Logout, try to invest
     - Expected: Redirect to login or error message
   
   - **Network failure**: Disconnect internet, try to invest
     - Expected: Error toast with network message
   
   - **Server error**: Stop backend, try to invest
     - Expected: Error toast: "No response from server"
   
   - **Invalid amount**: Enter negative number
     - Expected: Validation error before API call

---

## Database Verification Queries

### Check Investment Record
```javascript
// In MongoDB
db.investments.findOne({ project: ObjectId("PROJECT_ID") }).sort({ createdAt: -1 })

// Expected fields:
{
  investor: ObjectId("..."),
  project: ObjectId("..."),
  amountInr: 10000,
  sharePercent: 10,
  transactionHash: "0x...",
  status: "Confirmed",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Check Project Update
```javascript
// In MongoDB
db.projects.findOne({ _id: ObjectId("PROJECT_ID") })

// Verify fields updated:
{
  currentFundingInr: <increased value>,
  investorCount: <increased count>,
  investments: [
    { investor: ObjectId("..."), amount: 10000 },
    ...
  ],
  status: "Funding" or "Live",
  splitterContractAddress: "0x..." (if funded)
}
```

---

## Browser Console Tests

### Test Investment API Directly
```javascript
// Open browser console on any page
const response = await fetch('http://localhost:5001/api/investments/PROJECT_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({ amount: 10000 })
});

const data = await response.json();
console.log(data);
```

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| API Response Time | < 500ms | ___ ms |
| UI Update Delay | < 100ms | ___ ms |
| Modal Open Time | < 50ms | ___ ms |
| Query Refetch Time | < 300ms | ___ ms |

---

## Common Issues & Solutions

### Issue 1: Investment Not Recorded
**Symptoms**: API returns success but database unchanged
**Solution**: Check MongoDB connection, verify collection names

### Issue 2: UI Not Updating
**Symptoms**: Investment succeeds but UI doesn't refresh
**Solution**: Verify `onSuccess` callback is called, check query invalidation

### Issue 3: Button Always Disabled
**Symptoms**: "Invest Now" button disabled even on Funding projects
**Solution**: Check project status field, verify `project.status === 'Funding'`

### Issue 4: Creator Can Invest
**Symptoms**: Creator self-funding not prevented
**Solution**: Verify `req.user.userId` matches JWT token, check comparison logic

### Issue 5: Amount Validation Fails
**Symptoms**: Valid amounts rejected
**Solution**: Check data type (string vs number), verify minimum amount constant

---

## Automated Test Suite (Future)

### Jest Test Examples

```javascript
describe('Investment Flow', () => {
  test('should create investment successfully', async () => {
    const response = await createInvestment(projectId, 10000);
    expect(response.success).toBe(true);
    expect(response.investment.amountInr).toBe(10000);
  });

  test('should prevent creator self-funding', async () => {
    await expect(
      createInvestmentAsCreator(projectId, 10000)
    ).rejects.toThrow('Creators cannot invest in their own project');
  });

  test('should reject below minimum investment', async () => {
    await expect(
      createInvestment(projectId, 500)
    ).rejects.toThrow('Minimum investment is ₹1,000');
  });
});
```

---

## Test Completion Checklist

- [ ] Test 1: Basic Investment Flow (INR) ✓
- [ ] Test 2: Funding Goal Completion ✓
- [ ] Test 3: Creator Self-Funding Prevention ✓
- [ ] Test 4: Minimum Investment Validation ✓
- [ ] Test 5: Closed Project Investment Prevention ✓
- [ ] Test 6: Dual Mode Investment (ETH) ✓
- [ ] Test 7: Real-Time UI Updates ✓
- [ ] Test 8: API Response Validation ✓
- [ ] Test 9: Multiple Sequential Investments ✓
- [ ] Test 10: Error Handling ✓
- [ ] Database Verification ✓
- [ ] Performance Benchmarks ✓

---

## Sign-Off

**Tester Name**: _________________  
**Date**: _________________  
**All Tests Passed**: Yes / No  
**Issues Found**: _________________  
**Notes**: _________________
