# Live AI Re-Scoring Feature - Implementation Guide

## 🎯 Overview

This document describes the complete implementation of the **Live AI Re-Scoring** feature for VeriFund - a "wow factor" feature that demonstrates real-time AI-powered score updates triggered by GitHub commits.

## 🏗️ Architecture

```
GitHub Push → Webhook → AI Service → Backend → Database → Frontend (Polling)
     ↓           ↓          ↓            ↓         ↓            ↓
  Commit    Receives   Analyzes    Updates    MongoDB    Animated
            Payload    Commit      Score                  Display
```

## 📁 Files Modified

### 1. AI Service (Python/FastAPI)
- **File**: `ai-service/main.py`
- **Changes**:
  - Added `GitHubWebhookPayload` Pydantic model for webhook validation
  - Created `/webhook/github/{project_id}` POST endpoint
  - Implemented commit message analysis logic
  - Added async HTTP client to notify backend
  - Installed `httpx` dependency

### 2. Backend (Node.js/Express)
- **Files**: 
  - `backend/src/models/Project.model.js`
  - `backend/src/controllers/integration.controller.js`
  - `backend/src/routes/integration.routes.js`
- **Changes**:
  - Added `potentialScore` field to Project schema (0-100 range, default: 75)
  - Created `handleScoreUpdate` controller method
  - Added `/api/integrations/update-score` route
  - Implemented score calculation with bounds checking

### 3. Frontend (React)
- **Files**:
  - `frontend/src/components/ui/PotentialScoreDisplay.jsx`
  - `frontend/src/pages/CreatorDashboard.jsx`
- **Changes**:
  - Enhanced `PotentialScoreDisplay` to support live score animation
  - Added polling mechanism (5-second intervals) in CreatorDashboard
  - Implemented score change detection and toast notifications
  - Integrated Framer Motion for smooth animations

## 🔄 Complete Flow

### Step 1: GitHub Webhook Trigger
When a creator pushes code to their linked GitHub repository:
```bash
git add .
git commit -m "feat: add new dashboard feature"
git push origin main
```

### Step 2: AI Service Processing
The AI service receives the webhook at:
```
POST http://localhost:8000/webhook/github/{projectId}
```

**Logic**:
- Extracts commit message from payload
- Checks for meaningful keywords: `feat`, `fix`, `chore`, `docs`, `refactor`, etc.
- Calculates score increase: +0.5 to +2.5 points (if keywords found)
- Calls backend to update database

### Step 3: Backend Database Update
Backend receives score update at:
```
POST http://localhost:5000/api/integrations/update-score
```

**Request Body**:
```json
{
  "projectId": "673ab123456789",
  "scoreIncrease": 1.8,
  "commitMessage": "feat: add new dashboard feature"
}
```

**Process**:
1. Validates projectId and scoreIncrease
2. Fetches project from MongoDB
3. Calculates new score: `newScore = oldScore + scoreIncrease`
4. Ensures score stays within 0-100 bounds
5. Saves updated project
6. Returns confirmation

### Step 4: Frontend Live Update
The CreatorDashboard polls for updates every 5 seconds:

**Polling Configuration**:
```javascript
useQuery({
  queryKey: ['myProjects'],
  queryFn: fetchMyProjects,
  refetchInterval: 5000, // 5-second polling
  refetchIntervalInBackground: false
});
```

**Animation Trigger**:
When a score change is detected:
1. `useEffect` compares new score with previous score
2. Updates state to trigger re-render
3. `PotentialScoreDisplay` animates from old to new value (1.5s duration)
4. Shows toast notification: "🎉 Your potential score increased by X points!"

## 🎨 UI Features

### PotentialScoreDisplay Component
- **Animated Score Counter**: Uses Framer Motion's `animate()` function
- **Dynamic Color Coding**:
  - 🟢 Green (80-100): Excellent
  - 🟡 Yellow (60-79): Good
  - 🔴 Red (0-59): Needs Improvement
- **Progress Bar**: Visual representation of score
- **Real-time Updates**: Smooth transitions on score changes

### Visual Indicators
- Rotating refresh icon during animation
- Pulsing scale effect on score number
- Color-coded chip badges
- Gradient progress bar with glow effect

## 🔧 Setup Instructions

### 1. Install Dependencies

**AI Service**:
```bash
cd ai-service
pip install -r requirements.txt
```

**Backend** (already installed):
```bash
cd backend
npm install
```

**Frontend** (already installed):
```bash
cd frontend
npm install
```

### 2. Start Services

**Terminal 1 - AI Service**:
```bash
cd ai-service
python main.py
# Running on http://localhost:8000
```

**Terminal 2 - Backend**:
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

### 3. Set Up GitHub Webhook (For Production)

1. Go to your GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Set Payload URL: `http://your-domain.com:8000/webhook/github/{projectId}`
4. Content type: `application/json`
5. Select: "Just the push event"
6. Click "Add webhook"

**For Local Testing**, use [ngrok](https://ngrok.com/):
```bash
ngrok http 8000
# Use the ngrok URL in GitHub webhook settings
```

## 🧪 Testing the Feature

### Option 1: Manual Testing with Webhook Simulator

Use Postman or curl to simulate a GitHub webhook:

```bash
curl -X POST http://localhost:8000/webhook/github/YOUR_PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "head_commit": {
      "message": "feat: add new feature",
      "author": {"name": "Developer"},
      "timestamp": "2025-10-13T10:00:00Z"
    },
    "repository": {
      "name": "test-repo",
      "full_name": "user/test-repo"
    }
  }'
```

### Option 2: Real GitHub Push

1. Link a GitHub repository to your project
2. Make changes to the code
3. Commit with meaningful message: `git commit -m "feat: new feature"`
4. Push: `git push origin main`
5. Watch the dashboard for live score update!

### Expected Behavior

1. **AI Service Console**: Shows webhook received and score calculated
2. **Backend Console**: Shows score update processed
3. **Frontend**: 
   - Score number animates smoothly
   - Toast notification appears
   - Progress bar updates
   - Color may change if score crosses threshold

## 📊 Score Calculation Logic

### Meaningful Commit Keywords

| Keyword | Type | Description |
|---------|------|-------------|
| `feat`, `feature` | Feature | New functionality |
| `fix`, `bugfix` | Bug Fix | Error corrections |
| `chore` | Maintenance | Regular tasks |
| `docs`, `documentation` | Documentation | Code documentation |
| `refactor` | Refactoring | Code improvements |
| `perf`, `performance` | Performance | Speed optimizations |
| `test` | Testing | Test additions |
| `style` | Styling | Code formatting |

### Score Increase Range
- **Meaningful commits**: +0.5 to +2.5 points
- **Non-meaningful commits**: 0 points
- **Score bounds**: Always kept between 0-100

## 🚀 Demo Flow

1. **Login as Creator** → Navigate to Creator Dashboard
2. **View Initial Score** → See current potential score (e.g., 75)
3. **Make Code Change** → Edit a file in your linked repository
4. **Commit with Keyword** → `git commit -m "feat: improve UI"`
5. **Push Code** → `git push origin main`
6. **Watch Dashboard** → Within 5 seconds, score animates up
7. **Toast Notification** → "🎉 Your potential score increased by 1.8 points!"

## 🎯 Key Features

✅ **Real-time Updates**: No page refresh needed  
✅ **Smooth Animations**: Professional 1.5s transitions  
✅ **Intelligent Analysis**: Only meaningful commits increase score  
✅ **User Feedback**: Toast notifications for score changes  
✅ **Visual Appeal**: Color-coded badges and progress bars  
✅ **Performance**: Efficient 5-second polling with background pause  
✅ **Error Handling**: Graceful fallbacks if services are down  

## 🔐 Security Considerations

- GitHub webhooks should be validated with secret tokens (production)
- Score update endpoint can be protected with API key authentication
- Rate limiting should be implemented to prevent abuse
- Input validation on all endpoints

## 📝 Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time WebSocket connections
2. **Score History Graph**: Show score changes over time
3. **Detailed Commit Analysis**: Use NLP to analyze commit quality
4. **Multi-Project Support**: Aggregate scores across all projects
5. **GitHub Integration UI**: In-app repository linking
6. **Score Breakdown**: Show which commits contributed most

## 🐛 Troubleshooting

### Score Not Updating

**Check**:
1. AI service is running: `http://localhost:8000/docs`
2. Backend is running: `http://localhost:5000/api/integrations/health`
3. Project ID is correct in webhook URL
4. Commit message contains meaningful keywords
5. Browser console for polling errors

### Animation Not Smooth

**Check**:
1. Framer Motion is installed: `npm list framer-motion`
2. No JavaScript errors in console
3. Browser supports CSS animations
4. React DevTools shows state updates

### Webhook Not Received

**Check**:
1. GitHub webhook is configured correctly
2. Payload URL is accessible (use ngrok for local)
3. Webhook secret matches (if configured)
4. GitHub webhook deliveries tab for errors

## 📚 API Endpoints Reference

### AI Service

**POST** `/webhook/github/{project_id}`
- Receives GitHub webhook payload
- Analyzes commit message
- Calculates score increase
- Notifies backend

### Backend

**POST** `/api/integrations/update-score`
- Updates project potential score
- Request: `{ projectId, scoreIncrease, commitMessage }`
- Response: `{ success, data: { oldScore, newScore, scoreIncrease } }`

**GET** `/api/projects/my-projects`
- Fetches creator's projects with scores
- Used by polling mechanism

## 🎓 Technologies Used

- **AI Service**: Python, FastAPI, Pydantic, httpx, numpy
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Material-UI, Framer Motion, TanStack Query
- **Communication**: REST API, HTTP polling (WebSocket-ready)

## ✅ Completion Checklist

- [x] AI webhook endpoint implemented
- [x] Backend score update route created
- [x] Project model updated with potentialScore
- [x] PotentialScoreDisplay component enhanced
- [x] Polling mechanism added to CreatorDashboard
- [x] Toast notifications implemented
- [x] Dependencies installed (httpx)
- [x] Error handling added
- [x] Documentation created

## 🏆 Hackathon Impact

This feature demonstrates:
- **Full-stack proficiency**: Python, Node.js, React
- **Real-time capabilities**: Live updates without WebSockets
- **AI integration**: Intelligent commit analysis
- **Professional UI/UX**: Smooth animations and feedback
- **Production-ready**: Error handling, validation, logging
- **Scalability**: Polling can be replaced with WebSockets

---

**Built with ❤️ for VeriFund Hackathon**

