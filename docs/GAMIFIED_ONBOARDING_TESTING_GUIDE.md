# Gamified Onboarding - Visual Testing Guide

## Quick Start Testing

### 1. Start the Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Service:**
```bash
cd ai-service
python main.py
```

### 2. Navigate to Create Project Page
1. Open browser to `http://localhost:5173`
2. Connect your MetaMask wallet
3. Select "Creator" role
4. Click "Create Project" button

---

## Feature Testing Walkthrough

### 🚀 Feature 1: Progress Bar & Branding

**What to Look For:**
- [ ] Top section shows "Building Your Potential Profile" with rocket icon
- [ ] Progress bar is visible below the title
- [ ] Progress bar shows "Step 1 of 3 • 33% Complete"
- [ ] Progress bar has gradient styling (blue to teal)

**Visual Check:**
```
┌─────────────────────────────────────────┐
│ 🚀 Building Your Potential Profile     │
│ ██████████░░░░░░░░░░░░░░░░░░ 33%       │
│ Step 1 of 3 • 33% Complete              │
└─────────────────────────────────────────┘
```

---

### 🤖 Feature 2: Real-time AI Pricing Advice

**Test Steps:**
1. **Fill in Project Title** (at least 10 characters)
   - Type: "Revolutionary AI-Powered Financial Planning App"
   
2. **Select Category**
   - Choose: "Technology"

3. **Write Description** (at least 50 characters)
   - Type a detailed description about the project

4. **Wait 1.5 seconds** (don't touch anything)

**What Should Happen:**
- [ ] You see: "🤖 AI Co-pilot is analyzing your project..." (loading state)
- [ ] After ~2 seconds, a bordered box appears with pricing suggestions
- [ ] Box header shows: "🚀 AI Co-pilot Pricing Advice"
- [ ] Three price options are displayed:
  - Minimum (e.g., ₹3,00,000)
  - Maximum (e.g., ₹7,00,000)
  - Recommended (highlighted, e.g., ₹5,00,000)

**Visual Check:**
```
┌─────────────────────────────────────────────────────┐
│ 🤖 AI Co-pilot is analyzing your project...         │
└─────────────────────────────────────────────────────┘

↓ Changes to ↓

┌─────────────────────────────────────────────────────┐
│ 🚀 AI Co-pilot Pricing Advice                       │
│                                                      │
│ For a project like this, a typical funding goal is  │
│ between:                                             │
│                                                      │
│ [₹3,00,000] to [₹7,00,000]                          │
│                                                      │
│ [Recommended: ₹5,00,000]                             │
│                                                      │
│ 💡 Click on any amount to apply it                  │
└─────────────────────────────────────────────────────┘
```

**Interactive Test:**
- [ ] Click on "Recommended: ₹5,00,000"
- [ ] Funding Goal field should auto-fill with 500000
- [ ] Toast notification appears: "Suggested price applied!"

---

### ✨ Feature 3: Smooth Step Animations

**Test Steps:**
1. Fill out Step 1 completely
2. Click "Next: Link Profiles" button

**What Should Happen:**
- [ ] Current content fades out and slides up slightly
- [ ] New content (Step 2) fades in and slides down
- [ ] Animation is smooth (300ms duration)
- [ ] Progress bar updates: "Step 2 of 3 • 67% Complete"

**Visual Effect:**
```
Step 1 Content
    ↓ (fade out + slide up)
  [Blank for 300ms]
    ↓ (fade in + slide down)
Step 2 Content
```

---

### 🎯 Feature 4: Profile Strength Gamification

**Test Steps:**
1. On Step 2, leave all fields empty initially
2. Fill in GitHub URL
3. Fill in LinkedIn URL
4. Continue adding more profiles

**What Should Happen:**

**Initially (0 profiles):**
- [ ] No profile strength indicator visible

**After 1st profile:**
```
┌─────────────────────────────────────────────────────┐
│ ✅ 🎯 Profile Strength: 20%                          │
│                                                      │
│ 1 of 5 profiles linked • Add 4 more to maximize    │
│ your credibility                                     │
└─────────────────────────────────────────────────────┘
```

**After 3rd profile:**
```
┌─────────────────────────────────────────────────────┐
│ ✅ 🎯 Profile Strength: 60%                          │
│                                                      │
│ 3 of 5 profiles linked • Add 2 more to maximize    │
│ your credibility                                     │
└─────────────────────────────────────────────────────┘
```

**After ALL profiles:**
```
┌─────────────────────────────────────────────────────┐
│ ✅ 🎯 Profile Strength: 100%                         │
│                                                      │
│ 5 of 5 profiles linked • Amazing! Your profile is   │
│ complete!                                            │
└─────────────────────────────────────────────────────┘
```

---

### 📝 Feature 5: Profile Link Fields

**Test Available Fields:**
- [ ] GitHub (GitHubIcon)
- [ ] LinkedIn (LinkedInIcon)
- [ ] Portfolio Website (LanguageIcon)
- [ ] Twitter/X (TwitterIcon)
- [ ] Dribbble (BrushIcon) - NEW!

**Test URLs:**
```
GitHub:    https://github.com/testuser
LinkedIn:  https://linkedin.com/in/testuser
Portfolio: https://mywebsite.com
Twitter:   https://twitter.com/testuser
Dribbble:  https://dribbble.com/testuser
```

---

### 🎬 Feature 6: Complete Flow Test

**Full Journey:**
1. **Step 1**: Fill all fields
   - Watch AI suggestions appear automatically
   - Click recommended price
   - Click "Next: Link Profiles"
   - **Check**: Smooth animation to Step 2
   - **Check**: Progress bar shows 67%

2. **Step 2**: Add profile links
   - Add GitHub URL
   - **Check**: Profile strength shows 20%
   - Add LinkedIn URL
   - **Check**: Profile strength shows 40%
   - Add remaining profiles
   - **Check**: Profile strength reaches 100%
   - Click "Next: Review"
   - **Check**: Smooth animation to Step 3

3. **Step 3**: Review and Submit
   - **Check**: All data from Step 1 is displayed
   - **Check**: All profile links are shown (if added)
   - Click "Submit Project"
   - **Check**: Loading spinner appears
   - **Check**: Success message appears
   - **Check**: Redirects to project page

---

## Backend Data Verification

### Check Database After Submission

**MongoDB Query:**
```javascript
db.projects.findOne({ title: "Revolutionary AI-Powered Financial Planning App" })
```

**Expected Output:**
```json
{
  "_id": "...",
  "title": "Revolutionary AI-Powered Financial Planning App",
  "description": "...",
  "category": "Technology",
  "fundingGoalInr": 500000,
  "links": {
    "github": "https://github.com/testuser",
    "linkedin": "https://linkedin.com/in/testuser",
    "portfolio": "https://mywebsite.com",
    "twitter": "https://twitter.com/testuser",
    "dribbble": "https://dribbble.com/testuser"
  },
  "creator": "...",
  "status": "Pending",
  "createdAt": "..."
}
```

**Verify:**
- [ ] `links` object exists
- [ ] All provided profile URLs are saved
- [ ] Empty profile fields are stored as empty strings (not missing)

---

## Edge Cases to Test

### 1. AI Pricing with Minimal Data
**Test:** Type short title (< 10 chars) and short description (< 50 chars)
- [ ] AI suggestions do NOT appear
- [ ] No error messages appear

### 2. Skip All Profile Links
**Test:** Leave all profile fields empty in Step 2
- [ ] No profile strength indicator appears
- [ ] Can still proceed to Step 3
- [ ] Project saves successfully with empty links

### 3. Rapid Step Navigation
**Test:** Click Next → Back → Next quickly
- [ ] Animations don't overlap or glitch
- [ ] Data persists correctly
- [ ] Progress bar updates accurately

### 4. Browser Back Button
**Test:** Use browser back button during form
- [ ] Form state is preserved (or gracefully reset)
- [ ] No JavaScript errors in console

---

## Performance Checks

### Debounce Verification
**Test:** Type in title/description fields rapidly
- [ ] AI suggestions only trigger after 1.5 seconds of no typing
- [ ] Multiple API calls are NOT made for each keystroke
- [ ] Loading state appears/disappears correctly

### Animation Performance
**Test:** Navigate through all 3 steps multiple times
- [ ] Animations remain smooth (60fps)
- [ ] No lag or stuttering
- [ ] Memory doesn't spike (check DevTools Performance tab)

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Check:**
- Framer Motion animations work
- Progress bar gradient renders correctly
- All icons display properly

---

## Mobile Responsiveness

**Test on Mobile Viewport** (DevTools → Responsive Mode):
- [ ] Progress bar fits on screen
- [ ] Profile strength indicator wraps nicely
- [ ] AI suggestions box is readable
- [ ] All buttons are tappable (min 44px touch target)

**Recommended Test Sizes:**
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

---

## Success Criteria

All features are working if:
1. ✅ Progress bar shows and updates correctly
2. ✅ AI suggestions appear automatically after typing
3. ✅ Animations are smooth between steps
4. ✅ Profile strength gamification updates in real-time
5. ✅ All profile links save to database
6. ✅ Complete project creation flow works end-to-end

---

## Common Issues & Solutions

### Issue: AI suggestions not appearing
**Solution:** Check that AI service is running on port 8000

### Issue: Animations not working
**Solution:** Verify Framer Motion is installed: `npm list framer-motion`

### Issue: Progress bar not updating
**Solution:** Check that `activeStep` state is changing in React DevTools

### Issue: Profile links not saving
**Solution:** Check backend console for errors, verify MongoDB connection

---

## Screenshots to Capture

For documentation/demo purposes, capture:
1. Progress bar at Step 1 (33%)
2. AI Co-pilot suggestion box with prices
3. Profile strength indicator at 60%
4. Smooth animation between steps (video/GIF)
5. Final review page with all data

---

**Happy Testing! 🚀**

If you encounter any issues, check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Backend terminal for server errors
4. AI service terminal for Python errors
