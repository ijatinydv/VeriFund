# Testing the Live AI Re-Scoring Feature

## 🧪 Quick Test Guide

Follow these steps to test the complete live re-scoring feature:

## Prerequisites
Make sure all services are running:

### Terminal 1 - AI Service
```bash
cd ai-service
python main.py
# Should show: Running on http://127.0.0.1:8000
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev
# Should show: Server running on port 5000
```

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:5173
```

## 🎯 Test Scenario 1: Manual Webhook Test

### Step 1: Get Your Project ID
1. Open browser: `http://localhost:5173`
2. Login as a Creator
3. Navigate to Creator Dashboard
4. Open DevTools (F12) → Console
5. Type: `localStorage.getItem('token')` to verify you're logged in
6. Look at your projects and note the Project ID (or check MongoDB)

### Step 2: Simulate a GitHub Webhook
Open a new terminal and run:

```bash
# Replace YOUR_PROJECT_ID with actual project ID
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "head_commit": {
      "message": "feat: add amazing new feature",
      "author": {"name": "Test Developer"},
      "timestamp": "2025-10-13T10:00:00Z"
    },
    "repository": {
      "name": "test-repo",
      "full_name": "user/test-repo"
    }
  }'
```

### Step 3: Watch the Magic! ✨
**Within 5 seconds**, you should see on the Creator Dashboard:

1. ✅ Console log: `🔄 Score updated: 75 → 76.8`
2. ✅ Toast notification appears: "🎉 Your potential score increased by 1.8 points!"
3. ✅ Score number animates smoothly from old to new value
4. ✅ Progress bar updates
5. ✅ Color may change if threshold crossed

## 🎯 Test Scenario 2: Different Commit Types

Test with various commit messages:

### Meaningful Commits (Should Increase Score)
```bash
# Feature commit
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"feat: new payment integration"},"repository":{"name":"test"}}'

# Bug fix
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"fix: resolve authentication bug"},"repository":{"name":"test"}}'

# Refactoring
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"refactor: improve code quality"},"repository":{"name":"test"}}'
```

### Non-Meaningful Commits (Should NOT Increase Score)
```bash
# Regular commit without keyword
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"update readme"},"repository":{"name":"test"}}'
```

## 🎯 Test Scenario 3: Using the Test Script

We've provided a Python test script that sends multiple test commits:

```bash
# Make sure you're in the project root
python test_webhook.py YOUR_PROJECT_ID
```

This will:
- ✅ Check if services are running
- ✅ Send 3 different test commits
- ✅ Show results for each commit
- ✅ Give you instructions for watching the dashboard

## 📊 What to Observe

### AI Service Console
You should see:
```
================================================================================
[Webhook] Received GitHub webhook for project: 673ab123456789
================================================================================
[Webhook] Commit message: 'feat: add new dashboard feature'
[Webhook] Branch: refs/heads/main
[Webhook] ✓ Meaningful commit detected (keyword: 'feat')
[Webhook] ✓ Score increase calculated: +1.8 points
[Webhook] ✓ Backend notified successfully
================================================================================
```

### Backend Console
You should see:
```
=== Score Update Received ===
Project ID: 673ab123456789
Score Increase: 1.8
Commit Message: feat: add new dashboard feature
✓ Score updated: 75 → 76.8 (+1.8)
```

### Frontend Browser Console
You should see:
```
🔄 Score updated: 75 → 76.8
```

### Frontend UI
You should see:
1. **Live Updates Active** chip at the top (pulsing green)
2. **Score animation**: Number smoothly transitions over 1.5 seconds
3. **Toast notification**: Green success message appears
4. **Progress bar**: Updates to reflect new score
5. **Color changes**: If score crosses thresholds (60, 80)

## 🐛 Troubleshooting

### Score Not Updating?

**Check 1: All services running?**
```bash
# Test AI Service
curl http://localhost:8000/

# Test Backend
curl http://localhost:5000/api/integrations/health
```

**Check 2: Project ID correct?**
- Open MongoDB Compass
- Check your projects collection
- Copy the exact `_id` value

**Check 3: Commit message has keywords?**
Meaningful keywords: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `style`

**Check 4: Browser console for errors?**
- Open DevTools (F12)
- Check Console tab for any errors
- Check Network tab to see if polling is happening

### Animation Not Smooth?

**Check 1: Framer Motion installed?**
```bash
cd frontend
npm list framer-motion
```

**Check 2: Clear browser cache**
- Ctrl + Shift + R (hard refresh)

**Check 3: Check React DevTools**
- Install React DevTools extension
- Verify state updates are happening

## 🎬 Demo Flow for Hackathon

### Setup (Before Demo)
1. Have all 3 terminals open with services running
2. Have browser open with Creator Dashboard
3. Have a terminal ready with curl command (pre-filled with project ID)
4. Have screen sharing ready

### During Demo
1. **Show Dashboard** (5 seconds)
   - "Here's our Creator Dashboard with current potential score of 75"
   - Point out the "Live Updates Active" indicator

2. **Explain Feature** (10 seconds)
   - "When creators push code, our AI analyzes commits and updates their score in real-time"

3. **Execute Webhook** (5 seconds)
   - Switch to terminal
   - Execute curl command
   - "Let's simulate a GitHub push event"

4. **Show Processing** (5 seconds)
   - Show AI Service console
   - "Our AI detected a feature commit"
   - Show score increase calculation

5. **Show Live Update** (10 seconds)
   - Switch back to browser
   - Watch score animate
   - Point out toast notification
   - "No page refresh needed - completely live!"

6. **Highlight Tech** (10 seconds)
   - "Python FastAPI for AI processing"
   - "Node.js backend for data management"
   - "React with Framer Motion for smooth animations"
   - "Real-time polling with 5-second intervals"

**Total Demo Time: ~45 seconds**

## 📈 Advanced Testing

### Test Multiple Rapid Commits
```bash
# Send 3 commits quickly
for i in {1..3}; do
  curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"refs/heads/main\",\"head_commit\":{\"message\":\"feat: feature $i\"},\"repository\":{\"name\":\"test\"}}"
  sleep 1
done
```

Watch the score increase multiple times!

### Test Score Bounds
The score is capped at 100. Try sending many commits to see the limit:
```bash
# Send 20 commits (score should cap at 100)
for i in {1..20}; do
  curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
    -H "Content-Type: application/json" \
    -d '{"ref":"refs/heads/main","head_commit":{"message":"feat: feature"},"repository":{"name":"test"}}'
  sleep 6  # Wait for polling interval
done
```

## ✅ Success Checklist

- [ ] AI service receives webhook
- [ ] Commit message is analyzed correctly
- [ ] Score increase is calculated (0.5-2.5 for meaningful commits)
- [ ] Backend receives update and updates MongoDB
- [ ] Frontend polls and detects change within 5 seconds
- [ ] Score animates smoothly (1.5 second transition)
- [ ] Toast notification appears
- [ ] Progress bar updates
- [ ] Console logs show the flow
- [ ] "Live Updates Active" indicator is visible

## 🎉 You're Ready!

If all checkboxes are ticked, your Live AI Re-Scoring feature is working perfectly!

**Pro Tips for Demo:**
- Practice the timing a few times
- Have project ID ready and copied
- Keep terminals organized and visible
- Have a backup project ID in case something goes wrong
- Test 5 minutes before presenting

Good luck with your hackathon! 🚀
