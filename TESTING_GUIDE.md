# 🧪 Testing Guide - Final Integration Features

## Quick Test Plan for AI Price Suggestion & Investment Flow

### Prerequisites
✅ Backend running on `http://localhost:5001`
✅ Frontend running on `http://localhost:5173`
✅ AI service running on `http://localhost:8000`
✅ Wallet connected (MetaMask with test ETH on Sepolia)
✅ User logged in as Creator (for price suggestion)
✅ User logged in as Investor (for investment)

---

## Test 1: AI Price Suggestion (Creator Flow)

### Setup
1. Login as a Creator
2. Navigate to "Create Project" page
3. You should be on Step 1: Project Details

### Test Steps

#### ✅ Test 1.1: Validation Check
1. Click "Get AI Price Suggestion" button WITHOUT filling any fields
2. **Expected**: Error toast "Please fill in title, description, and category first"
3. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 1.2: Successful Price Suggestion
1. Fill in:
   - Title: "Revolutionary FinTech App"
   - Description: "An innovative financial technology platform that helps users manage their finances with AI-powered insights and personalized recommendations."
   - Category: "Finance"
2. Click "Get AI Price Suggestion" button
3. **Expected**:
   - Button shows "Analyzing..." with spinner
   - After ~1-2 seconds, Alert appears with:
     - Min price (e.g., ₹3,00,000)
     - Recommended price (e.g., ₹5,00,000)
     - Max price (e.g., ₹7,00,000)
   - Success toast with 💡 icon
4. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 1.3: Apply Suggested Price
1. Click on "Recommended" chip in the suggestion
2. **Expected**:
   - Funding Goal field updates to recommended amount
   - Success toast "Suggested price applied!"
3. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 1.4: Different Categories
1. Change category to "Technology"
2. Click "Get AI Price Suggestion" again
3. **Expected**:
   - New suggestion appears (different from Finance category)
4. Change to "Social Impact"
5. Click button again
6. **Expected**:
   - Lower suggested prices (social impact typically has lower budgets)
7. **Status**: ⬜ Pass / ⬜ Fail

---

## Test 2: Investment Flow (Investor Flow)

### Setup
1. Ensure there's at least one project with:
   - Status: "Active"
   - Has `splitterContractAddress` set
2. Login as an Investor
3. Browse to a project detail page

### Test Steps

#### ✅ Test 2.1: Open Investment Modal
1. Click "Invest Now" button on project detail page
2. **Expected**:
   - Modal opens with title "Fund Project"
   - Shows project title
   - Amount input field visible
   - Contract address displayed
   - Warning alert visible
3. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.2: Validation Check
1. Leave amount field empty
2. Click "Confirm Investment"
3. **Expected**: 
   - Button is disabled (grayed out)
4. Enter "0" in amount field
5. Click "Confirm Investment"
6. **Expected**:
   - Error toast "Please enter a valid amount"
   - Error alert appears in modal
7. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.3: MetaMask Rejection
1. Enter a valid amount (e.g., "0.001")
2. Click "Confirm Investment"
3. **Expected**:
   - MetaMask popup appears
   - Button shows "Confirm in Wallet..."
4. Click "Reject" in MetaMask
5. **Expected**:
   - Error alert appears in modal
   - Error toast shown
   - Button returns to "Confirm Investment" state
6. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.4: Successful Investment (Full Flow)
1. Enter amount: "0.001" ETH
2. Click "Confirm Investment"
3. **Expected Step 1 - Wallet Confirmation**:
   - MetaMask popup appears
   - Button shows "Confirm in Wallet..." with spinner
4. Approve in MetaMask
5. **Expected Step 2 - Processing**:
   - Alert appears: "Waiting for confirmation..."
   - Transaction hash shown in modal
   - Button still shows spinner with "Processing..."
6. Wait for blockchain confirmation (~15-30 seconds on Sepolia)
7. **Expected Step 3 - Recording**:
   - Alert changes to: "Recording your investment..."
   - Spinner still visible
8. Wait for backend to record investment (~1-2 seconds)
9. **Expected Step 4 - Success**:
   - Success alert appears: "Investment Successful! 🎉"
   - Shows amount invested
   - "View on Etherscan →" link visible
   - Success toast: "🎉 Investment recorded successfully!"
   - Button changes to "Close"
10. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.5: Etherscan Link
1. After successful investment, click "View on Etherscan →"
2. **Expected**:
   - New tab opens with Sepolia Etherscan
   - Transaction details visible
   - Status: "Success"
3. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.6: Data Refresh
1. After successful investment, close the modal
2. **Expected**:
   - Modal closes
   - Project page refreshes (query invalidation)
   - Project's "Amount Raised" increases by investment amount
   - Investment count increases
3. Navigate to Investor Dashboard
4. **Expected**:
   - New investment appears in "My Investments" list
5. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 2.7: Modal Reset
1. Close the modal after successful investment
2. Click "Invest Now" again
3. **Expected**:
   - Modal opens fresh
   - Amount field is empty
   - No success alerts visible
   - All states reset
4. **Status**: ⬜ Pass / ⬜ Fail

---

## Test 3: Edge Cases & Error Handling

#### ✅ Test 3.1: Network Error (AI Suggestion)
1. Stop the backend server
2. Try to get AI price suggestion
3. **Expected**:
   - Error toast appears
   - Button returns to normal state
4. Restart backend
5. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 3.2: Wrong Network (Investment)
1. Switch MetaMask to a different network (e.g., Mainnet)
2. Try to invest
3. **Expected**:
   - MetaMask shows network error
   - User can switch back to correct network
4. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 3.3: Insufficient Funds
1. Ensure wallet has less ETH than you're trying to invest
2. Enter large amount (e.g., "100" ETH)
3. Click "Confirm Investment"
4. **Expected**:
   - MetaMask shows "Insufficient funds" error
   - User cannot proceed
5. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 3.4: Backend Recording Failure
1. Make a successful investment
2. If backend fails during recording:
3. **Expected**:
   - Error toast: "Transaction succeeded but failed to record investment. Please contact support."
   - Transaction still went through on blockchain
   - User has transaction hash to prove investment
4. **Status**: ⬜ Pass / ⬜ Fail

---

## Test 4: UX & Loading States

#### ✅ Test 4.1: Loading States
1. Verify all loading states show spinners:
   - AI Price Suggestion: "Analyzing..." with spinner ✓
   - Investment: "Confirm in Wallet..." with spinner ✓
   - Investment: "Processing..." with spinner ✓
   - Recording: Shows CircularProgress ✓
2. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 4.2: Button Disabled States
1. Verify buttons are disabled when they should be:
   - "Get AI Suggestion" disabled when fields empty ✓
   - "Confirm Investment" disabled when no amount ✓
   - "Confirm Investment" disabled during processing ✓
   - "Cancel" disabled during critical operations ✓
2. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 4.3: Toast Notifications
1. Verify all toasts appear:
   - AI Suggestion success with 💡 ✓
   - Applied price success ✓
   - Investment recorded success with 🎉 ✓
   - Error toasts for failures ✓
2. **Status**: ⬜ Pass / ⬜ Fail

---

## Test 5: Mobile Responsiveness

#### ✅ Test 5.1: Mobile View (AI Suggestion)
1. Open DevTools, switch to mobile view (375px width)
2. Navigate to Create Project
3. **Expected**:
   - All fields stack vertically
   - Button text wraps properly
   - Chips in suggestion display on multiple lines if needed
4. **Status**: ⬜ Pass / ⬜ Fail

#### ✅ Test 5.2: Mobile View (Investment Modal)
1. Open investment modal on mobile view
2. **Expected**:
   - Modal fits screen
   - All content readable
   - Buttons accessible
   - Transaction hash wraps properly
3. **Status**: ⬜ Pass / ⬜ Fail

---

## 🐛 Common Issues & Fixes

### Issue 1: "Project contract address not found"
**Cause**: Project doesn't have `splitterContractAddress`
**Fix**: Ensure project has deployed splitter contract before investing

### Issue 2: AI Suggestion returns very low/high prices
**Cause**: Backend algorithm is simplified for demo
**Fix**: Normal behavior - adjust algorithm in backend for production

### Issue 3: Transaction stuck on "Processing..."
**Cause**: Blockchain congestion or network issues
**Fix**: Wait longer or increase gas price in MetaMask

### Issue 4: Investment recorded twice
**Cause**: `useEffect` dependency issue
**Fix**: Check that `investmentRecorded` flag is working correctly

### Issue 5: Modal won't close after investment
**Cause**: State not properly reset
**Fix**: Verify `handleClose` function calls `resetTransaction()`

---

## 📊 Test Results Summary

| Feature | Total Tests | Passed | Failed |
|---------|------------|--------|--------|
| AI Price Suggestion | 4 | ⬜ | ⬜ |
| Investment Flow | 7 | ⬜ | ⬜ |
| Edge Cases | 4 | ⬜ | ⬜ |
| UX & Loading | 3 | ⬜ | ⬜ |
| Mobile | 2 | ⬜ | ⬜ |
| **TOTAL** | **20** | **⬜** | **⬜** |

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. ✅ Test with real testnet ETH on Sepolia
2. ✅ Verify Etherscan links work correctly
3. ✅ Test with multiple concurrent investments
4. ✅ Load test AI service with many requests
5. ✅ Security audit of smart contract interactions
6. ✅ Review gas optimization
7. ✅ Add analytics tracking for user actions
8. ✅ Prepare for production deployment

---

**Test Date**: _____________
**Tester**: _____________
**Environment**: Development / Staging / Production
**Status**: ⬜ All Pass ⬜ Some Failures ⬜ Blocked
