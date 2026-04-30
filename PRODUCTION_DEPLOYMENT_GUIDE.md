# Production Deployment Fix Guide

## Current Issue

The application is deployed on Vercel but returning `401 Unauthorized` when trying to analyze code. The error shows:

```
POST https://code-reviewer-ai-tau.vercel.app/api/review-code 401 (Unauthorized)
```

## Root Cause

In production, the Next.js app needs to forward API requests to a backend Express server. The configuration chain is:

```
Browser → Vercel (Next.js) → Next.js rewrites /api/* → Backend Express Server
```

**The problem:** The `BACKEND_URL` environment variable in Vercel is not pointing to a working backend server, or the backend is not accessible.

## Solution

### Step 1: Verify Backend Deployment

You need a backend server running. Options:

#### Option A: Use Render.com (Free tier available)
1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repository
4. Set environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your mongodb connection string>
   JWT_SECRET=<generate a secure random string>
   GOOGLE_CLIENT_ID=553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<your secret>
   ```
5. Set start command: `npm start` or `cd server && npm start`
6. Deploy and note your backend URL (e.g., `https://your-backend-name.onrender.com`)

#### Option B: Use Railway (Also free tier)
1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Set environment variables (same as above)
5. Deploy and get your backend URL

#### Option C: Use Heroku (Paid)
Similar setup with environment variables

### Step 2: Update Vercel Environment Variables

1. Go to your Vercel project settings: https://vercel.com/dashboard
2. Go to **Settings → Environment Variables**
3. Add the following variables:

```
BACKEND_URL=https://your-backend-name.onrender.com
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
```

**Important:** Replace `https://your-backend-name.onrender.com` with your actual backend URL.

### Step 3: Verify Configuration Files

**In `/client/.env.production`:**
```
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=https://your-backend-name.onrender.com
```

**In `/client/next.config.js`:**
```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return [{
    source: '/api/:path*',
    destination: `${backendUrl}/api/:path*`,
  }];
}
```

### Step 4: Disable withCredentials for Production

Since we're using same-origin requests (via Next.js proxy), we don't need `withCredentials: true` in production. Update `/client/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
  // Only set withCredentials in development (localhost)
  withCredentials: typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Step 5: Redeploy

1. Merge the code changes (next.config.js port fix)
2. Push to main branch
3. Vercel will automatically redeploy with new environment variables
4. Test the application

## Deployment Architecture Diagram

### Local Development
```
Browser (localhost:3000)
    ↓
Next.js Dev Server
    ↓ (rewrite /api/* to http://localhost:5000)
Express Server (localhost:5000)
    ↓
MongoDB
```

### Production (Vercel)
```
Browser (code-reviewer-ai-tau.vercel.app)
    ↓
Vercel (Next.js App)
    ↓ (rewrite /api/* to BACKEND_URL)
Render/Railway/Heroku (Express Server)
    ↓
MongoDB Atlas (Cloud)
```

## Checklist

- [ ] Backend deployed to Render/Railway/Heroku
- [ ] Backend has all required environment variables set
- [ ] Backend URL is accessible (test: `curl https://your-backend/api/reviews`)
- [ ] Vercel has `BACKEND_URL` environment variable set
- [ ] Code changes pushed to main (next.config.js port fix)
- [ ] Vercel redeployed with new environment variables
- [ ] Test login works
- [ ] Test code analysis works (no 401 error)
- [ ] Test review history loads

## Troubleshooting

### Still getting 401 errors?

1. **Check backend logs** - Is the backend receiving requests?
   - Render: Check "Logs" tab
   - Railway: Check "Logs" section

2. **Verify token is being sent:**
   - Open browser DevTools → Network tab
   - Look at request headers for Authorization header
   - Should see: `Authorization: Bearer <token>`

3. **Check CORS on backend:**
   - In `server/server.js`, verify CORS origin includes your Vercel domain

4. **Check JWT_SECRET:**
   - Must be the SAME on both local and production
   - If different, tokens won't validate

### Backend is slow?

- Free tier on Render/Railway has cold starts (takes 30+ seconds first time)
- This is normal, upgrade to paid tier for always-on

### Backend won't connect to MongoDB?

- Verify `MONGODB_URI` is set correctly
- Ensure MongoDB Atlas has your backend's IP in whitelist (or allow 0.0.0.0)
- Test connection: `npm run test:apis` (if available)

## Quick Start: Deploy Backend to Render

```bash
# In your repository root

# 1. Create Render configuration
cat > render.yaml << 'EOF'
services:
  - type: web
    name: ai-code-reviewer-api
    env: node
    startCommand: cd server && npm install && npm start
    envVars:
      - key: NODE_ENV
        scope: build
        value: production
      - key: NODE_ENV
        scope: runtime
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: GOOGLE_CLIENT_ID
        value: 553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: GOOGLE_API_KEY
        sync: false
EOF

# 2. Commit and push
git add render.yaml
git commit -m "Add Render deployment config"
git push origin main

# 3. Go to https://render.com, create new Web Service
# 4. Connect your GitHub repo
# 5. Fill in secret environment variables:
#    - MONGODB_URI
#    - JWT_SECRET
#    - GOOGLE_CLIENT_SECRET
#    - OPENAI_API_KEY (optional, for AI analysis)
#    - GROQ_API_KEY (optional)
#    - GOOGLE_API_KEY (optional)
# 6. Deploy
```

## Summary of Changes

1. ✅ Fixed `next.config.js` port fallback from 5001 → 5000
2. ✅ Configured same-origin API proxy via Next.js rewrites
3. ✅ Token handling with redundant Authorization header
4. ⏳ Pending: Deploy Express backend to production
5. ⏳ Pending: Set BACKEND_URL in Vercel environment variables

Once backend is deployed and BACKEND_URL is set, authentication will work across all environments.
