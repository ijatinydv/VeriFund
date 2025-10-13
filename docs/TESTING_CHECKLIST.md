# ✅ Pre-Demo Testing Checklist

## 🚀 Before You Demo

### Server Startup
- [ ] Backend server running on port 5001
  ```bash
  cd backend && npm run dev
  ```
- [ ] Frontend server running on port 5173
  ```bash
  cd frontend && npm run dev
  ```
- [ ] MongoDB connected successfully
- [ ] No console errors in backend
- [ ] No console errors in frontend

### Database Setup
- [ ] At least one creator account exists
- [ ] Creator has at least 2-3 projects
- [ ] Projects have `currentFundingInr > 0`
- [ ] Project `creator` field matches logged-in user ID

### Browser Setup
- [ ] Chrome/Firefox browser open
- [ ] DevTools ready (F12)
- [ ] Network tab visible
- [ ] Console tab visible
- [ ] Clear cache and cookies

### Authentication
- [ ] Can connect MetaMask wallet
- [ ] Can sign authentication message
- [ ] JWT token stored in localStorage
- [ ] User role is "Creator"
- [ ] Can access Creator Dashboard

## 🧪 Feature Testing

### Test 1: Button Visibility
- [ ] "Cash Out to UPI" button visible on dashboard
- [ ] Button has dropdown arrow icon
- [ ] Button enabled when projects exist
- [ ] Button disabled when no projects

### Test 2: Project Dropdown
- [ ] Click button opens dropdown menu
- [ ] All creator's projects listed
- [ ] Each project shows correct title
- [ ] Each project shows status badge (Live/Funding)
- [ ] Each project shows payout amount
- [ ] Payout calculation correct (15% of funding)
- [ ] Menu scrollable if many projects
- [ ] Click outside closes menu

### Test 3: UPI Generation
- [ ] Select project from dropdown
- [ ] Modal opens immediately
- [ ] Loading spinner shows briefly
- [ ] Success alert displays
- [ ] Payout amount shown in green
- [ ] Project title displayed
- [ ] QR code renders clearly
- [ ] QR code is 256x256 pixels
- [ ] QR code is black on white background
- [ ] UPI ID displayed below QR

### Test 4: QR Code Scanning
- [ ] QR code scannable by phone camera
- [ ] PhonePe app recognizes QR
- [ ] Google Pay app recognizes QR
- [ ] Paytm app recognizes QR
- [ ] Amount pre-filled correctly (₹)
- [ ] Recipient name shown (Anjali VeriFund)
- [ ] UPI ID shown (anjali-demo@ybl)
- [ ] Note/description populated

### Test 5: Error Handling
- [ ] Works only for project creator
- [ ] Returns 403 for non-creator
- [ ] Handles invalid project ID
- [ ] Shows error toast on failure
- [ ] Network errors caught gracefully
- [ ] Modal closes on error

### Test 6: UI/UX
- [ ] Modal looks professional
- [ ] Colors match theme
- [ ] Text readable and clear
- [ ] Buttons work (Close, Done)
- [ ] Escape key closes modal
- [ ] Click outside closes modal
- [ ] Animations smooth
- [ ] Responsive on mobile

### Test 7: Multiple Projects
- [ ] Create 3 different projects
- [ ] Fund each with different amounts
- [ ] Verify dropdown shows all 3
- [ ] Verify payout amounts differ
- [ ] Can cash out from each project
- [ ] QR codes different for each

### Test 8: Edge Cases
- [ ] Project with ₹0 funding (should show ₹0.00)
- [ ] Very long project title (truncates nicely)
- [ ] Project just created (no funding yet)
- [ ] Logout and login again (persists)

## 📱 Phone Testing

### UPI App: PhonePe
- [ ] QR scan opens PhonePe
- [ ] Amount pre-filled
- [ ] Can proceed to payment screen
- [ ] Can cancel without paying

### UPI App: Google Pay
- [ ] QR scan opens Google Pay
- [ ] Amount pre-filled
- [ ] Can proceed to payment screen
- [ ] Can cancel without paying

### UPI App: Paytm
- [ ] QR scan opens Paytm
- [ ] Amount pre-filled
- [ ] Can proceed to payment screen
- [ ] Can cancel without paying

## 🔍 API Testing

### Backend Endpoint
- [ ] GET request to `/api/payout/upi-qr/:projectId` works
- [ ] Returns 200 OK for valid request
- [ ] Returns 401 without token
- [ ] Returns 403 for non-creator
- [ ] Returns 404 for invalid project
- [ ] Response has correct structure
- [ ] UPI string format valid

### Network Tab (Browser)
- [ ] Request shows in Network tab
- [ ] Status code 200
- [ ] Authorization header present
- [ ] Response time < 500ms
- [ ] Response data correct
- [ ] No CORS errors

### Console Logs
- [ ] Backend: "✅ UPI QR Code generated for project..."
- [ ] Backend: Shows payout amount
- [ ] Frontend: "🔍 UPI Response: {...}"
- [ ] Frontend: No error messages

## 🎯 Demo Rehearsal

### Timing (60 seconds total)
- [ ] 0-15s: Context and problem statement
- [ ] 15-25s: Show dashboard and click button
- [ ] 25-35s: Select project, QR appears
- [ ] 35-50s: Scan with phone, show UPI app
- [ ] 50-60s: Explain impact and benefits

### Practice Runs
- [ ] Run through demo 3 times
- [ ] Time yourself with stopwatch
- [ ] Smooth mouse movements
- [ ] Clear narration
- [ ] Confident delivery

### Backup Plans
- [ ] Screenshot of QR code (if phone fails)
- [ ] Video of phone scan (pre-recorded)
- [ ] Alternative project ready
- [ ] Know how to refresh if crash

## 📊 Performance Checks

### Speed
- [ ] Button click → Dropdown < 100ms
- [ ] Project select → Modal < 300ms
- [ ] API call → Response < 500ms
- [ ] QR render → Display < 200ms
- [ ] Total flow < 2 seconds

### Memory
- [ ] No memory leaks (DevTools Memory tab)
- [ ] Modal closes completely
- [ ] State resets properly

## 🛡️ Security Verification

- [ ] JWT token required for API
- [ ] Token in Authorization header
- [ ] Can't cash out other user's projects
- [ ] Project ownership validated
- [ ] No sensitive data in console
- [ ] No API keys exposed

## 📸 Documentation

- [ ] Take screenshot of dashboard
- [ ] Take screenshot of dropdown
- [ ] Take screenshot of modal with QR
- [ ] Take photo of phone scanning
- [ ] Record video of full flow (optional)

## 🎨 Visual Quality

- [ ] No layout shifts
- [ ] No overlapping elements
- [ ] Icons aligned properly
- [ ] Colors consistent
- [ ] Fonts readable
- [ ] Spacing uniform
- [ ] Borders and shadows subtle

## 📱 Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] QR renders correctly
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] QR renders correctly
- [ ] No console errors

### Safari (if on Mac)
- [ ] All features work
- [ ] QR renders correctly
- [ ] No console errors

### Mobile Chrome
- [ ] Responsive layout
- [ ] Touch targets large enough
- [ ] QR code scannable
- [ ] Modal fits screen

## 🚨 Final Checks (5 mins before demo)

- [ ] Backend running ✅
- [ ] Frontend running ✅
- [ ] Logged in as creator ✅
- [ ] Projects visible ✅
- [ ] Phone charged and ready ✅
- [ ] UPI app open ✅
- [ ] Internet connection stable ✅
- [ ] Browser window maximized ✅
- [ ] DevTools closed (for clean demo) ✅
- [ ] Notifications muted ✅
- [ ] Desktop clean (no clutter) ✅
- [ ] Confident and ready 💪

## 🎉 Success Criteria

### Minimum Viable Demo
✅ Can click button  
✅ Can select project  
✅ QR code displays  
✅ Can scan with phone  
✅ UPI app opens  

### Ideal Demo
✅ All above +  
✅ Multiple projects shown  
✅ Smooth animations  
✅ Fast response times  
✅ No errors or glitches  
✅ Professional narration  
✅ Judges impressed 🏆

## 📝 Notes Section

**Issues Found:**
```
(List any issues you encounter during testing)
```

**Fixes Applied:**
```
(List solutions implemented)
```

**Demo Notes:**
```
(Write down key talking points)
```

---

## ✅ Final Sign-Off

- [ ] All tests passed
- [ ] Demo rehearsed
- [ ] Backup plans ready
- [ ] Confident in feature
- [ ] Ready to wow judges!

**Tester Signature:** _______________  
**Date:** _______________  
**Time:** _______________

---

**Status: READY FOR DEMO 🚀**

Good luck! You've built something amazing! 🎉
