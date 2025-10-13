# 🚀 Quick Start Guide - Live AI Re-Scoring

## ⚡ 3-Minute Setup

### Step 1: Install Dependency (30 seconds)
```bash
cd ai-service
pip install httpx
cd ..
```

### Step 2: Start Services (60 seconds)

Open **3 separate terminals**:

**Terminal 1:**
```bash
cd ai-service
python main.py
```
Wait for: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2:**
```bash
cd backend
npm run dev
```
Wait for: `Server is running on port 5000`

**Terminal 3:**
```bash
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Step 3: Get Your Project ID (30 seconds)

1. Open browser: `http://localhost:5173`
2. Login as Creator
3. Go to Creator Dashboard
4. Open DevTools (F12) → Console
5. Type: `document.querySelector('[data-project-id]')?.dataset.projectId`
   
   OR check MongoDB:
   ```bash
   # If you have MongoDB Compass
   # Open → Connect to localhost:27017
   # Database: verifund → Collection: projects
   # Copy any _id value
   ```

### Step 4: Test! (60 seconds)

```bash
# Replace YOUR_PROJECT_ID with actual ID from Step 3
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"feat: awesome feature"},"repository":{"name":"test"}}'
```

**Watch your browser!** Within 5 seconds:
- ✅ Score animates upward
- ✅ Toast notification appears
- ✅ "Live Updates Active" badge visible

---

## 🎯 One-Liner Test Commands

### Test Feature Commit
```bash
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID -H "Content-Type: application/json" -d '{"ref":"refs/heads/main","head_commit":{"message":"feat: new feature"},"repository":{"name":"test"}}'
```

### Test Bug Fix
```bash
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID -H "Content-Type: application/json" -d '{"ref":"refs/heads/main","head_commit":{"message":"fix: resolve bug"},"repository":{"name":"test"}}'
```

### Test Refactor
```bash
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID -H "Content-Type: application/json" -d '{"ref":"refs/heads/main","head_commit":{"message":"refactor: improve code"},"repository":{"name":"test"}}'
```

### Test Non-Meaningful (No Score Change)
```bash
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID -H "Content-Type: application/json" -d '{"ref":"refs/heads/main","head_commit":{"message":"update readme"},"repository":{"name":"test"}}'
```

---

## 🎬 Hackathon Demo (30 seconds)

**Say This:**
> "Our platform uses AI to analyze developer activity in real-time. Watch what happens when a creator pushes new code..."

**Do This:**
1. Show Creator Dashboard (score visible)
2. Run curl command in terminal
3. Keep browser visible
4. Point to score when it animates
5. Point to toast notification

**Wow Factor:**
- No page refresh needed
- Smooth animation
- Under 6 seconds total
- AI-powered scoring

---

## 📋 Pre-Demo Checklist

- [ ] All 3 services running
- [ ] Project ID ready and tested
- [ ] Browser on Creator Dashboard
- [ ] Terminal with curl command ready
- [ ] Screen sharing/recording ready

---

## 🆘 Emergency Troubleshooting

**Score not updating?**
```bash
# Check services
curl http://localhost:8000/
curl http://localhost:5000/api/integrations/health
```

**Can't find project ID?**
```javascript
// In browser console
localStorage.getItem('token')  // Verify logged in
// Then check Network tab → API calls → look for project IDs
```

**Animation not working?**
```bash
# Clear browser cache
# Hard refresh: Ctrl + Shift + R
```

---

## 🎉 Success Signs

You'll know it's working when you see:

### In AI Service Console:
```
✓ Meaningful commit detected (keyword: 'feat')
✓ Score increase calculated: +1.8 points
```

### In Backend Console:
```
✓ Score updated: 75 → 76.8 (+1.8)
```

### In Browser:
- Green "Live Updates Active" badge
- Score number animates smoothly
- Toast: "🎉 Your potential score increased..."
- Console: "🔄 Score updated: 75 → 76.8"

---

## 📊 Feature Highlights for Pitch

✅ **Real-time** - Updates within 5 seconds  
✅ **AI-Powered** - Analyzes commit quality  
✅ **Smooth UX** - Professional animations  
✅ **Full-Stack** - Python + Node.js + React  
✅ **Production-Ready** - Error handling included  

---

## 🔗 Related Files

- **Full Documentation**: `FEATURE_COMPLETE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Architecture**: `ARCHITECTURE_DIAGRAM.md`
- **Implementation Details**: `LIVE_AI_RESCORING_IMPLEMENTATION.md`

---

**Total Setup Time: ~3 minutes**  
**Demo Time: ~30 seconds**  
**Wow Factor: 100%** 🚀

**You're ready to impress the judges! Good luck!** 🎉
