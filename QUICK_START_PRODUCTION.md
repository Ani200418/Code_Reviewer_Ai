# Quick Fix: Get Production Working in 5 Minutes

## The Problem
Your Vercel deployment shows `401 Unauthorized` when trying to analyze code.

## The Solution
Your Express backend needs to be deployed somewhere and its URL needs to be configured in Vercel.

## Quick Steps (Choose One)

### ✅ Option 1: Deploy to Render (Easiest - Free Tier Available)

**Step 1: Go to Render**
```
https://render.com/dashboard
```

**Step 2: Create New Web Service**
- Click "New +" → "Web Service"
- Connect your GitHub account
- Select your `ai-code-reviewer-v2` repository
- Choose `main` branch

**Step 3: Configure**
- **Name:** `ai-code-reviewer-api`
- **Environment:** `Node`
- **Build Command:** `npm install && cd server && npm install`
- **Start Command:** `cd server && npm start`
- **Region:** Choose closest to you

**Step 4: Set Environment Variables**
Click "Add Environment Variable" for each:

```
NODE_ENV = production
PORT = 5000
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/ai-code-reviewer?retryWrites=true&w=majority
JWT_SECRET = (generate: openssl rand -hex 32)
JWT_EXPIRES_IN = 7d
GOOGLE_CLIENT_ID = 553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = (leave blank if not using Google OAuth)
OPENAI_API_KEY = (your OpenAI key)
GROQ_API_KEY = (your Groq key)
GOOGLE_API_KEY = (your Google key)
CLIENT_URL = https://code-reviewer-ai-tau.vercel.app
```

**Step 5: Deploy**
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Copy your service URL (e.g., `https://ai-code-reviewer-api.onrender.com`)

### ✅ Option 2: Deploy to Railway (Also Free Tier)

**Step 1: Go to Railway**
```
https://railway.app/dashboard
```

**Step 2: New Project**
- Click "Create New Project"
- "Deploy from GitHub"
- Select your repository

**Step 3: Configure**
- Set same environment variables as above
- Start command: `cd server && npm start`

**Step 4: Get URL**
- Go to Settings
- Copy domain URL

---

## Step 6: Update Vercel Environment Variables

**Go to:** https://vercel.com/dashboard
1. Click your `ai-code-reviewer-v2` project
2. Go to Settings → Environment Variables
3. Add new variable:
   - **Name:** `BACKEND_URL`
   - **Value:** `https://your-render-url.onrender.com` (from Step 5)
   - **Environments:** Select all (Production, Preview, Development)
4. Click "Save and Deploy"

---

## Step 7: Test

1. Go to https://code-reviewer-ai-tau.vercel.app
2. Login (or signup)
3. Go to Dashboard → Review
4. Paste some code
5. Click "Analyze"
6. ✅ Should work now!

---

## If It Still Doesn't Work

**Check 1: Is your backend running?**
```bash
curl https://your-render-url.onrender.com/api/auth/me
# Should return 401 (no token), not 404 or 502
```

**Check 2: Check Vercel deployment**
```bash
# In Vercel project, check "Deployments"
# Should show your latest push with green checkmark
# If red, click and see error message
```

**Check 3: Check backend logs**
- Render: Click your service → Logs tab → See error messages
- Railway: Click project → Deployments → See logs

**Check 4: Verify environment variables**
- Vercel: Settings → Environment Variables → See all values set
- Render/Railway: Settings → Environment → See all values set

---

## What Each Variable Does

| Variable | Where | Purpose |
|----------|-------|---------|
| `BACKEND_URL` | Vercel | Tells Next.js where Express backend is |
| `MONGODB_URI` | Render/Railway | Connection to MongoDB database |
| `JWT_SECRET` | Render/Railway | Secret for signing authentication tokens |
| `OPENAI_API_KEY` | Render/Railway | For GPT-4 code analysis |
| `GROQ_API_KEY` | Render/Railway | Fast alternative for analysis |
| `GOOGLE_API_KEY` | Render/Railway | For Gemini code analysis |

---

## Need MongoDB?

If you don't have MongoDB, get it free:

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a cluster (free tier)
4. Get connection string: Deployment → Database → Connect
5. Copy the string and use as `MONGODB_URI`

---

## Generate JWT_SECRET

Run this in terminal:
```bash
openssl rand -hex 32
# Output: abc123def456...
# Use this as JWT_SECRET
```

---

## Git Commits Already Done

✅ Fixed local development (port 5001 → 5000)
✅ Fixed cookie handling (sameSite, withCredentials)
✅ Fixed next.config.js backend URL

These changes are in commits:
- `5a43015` - Auth fix
- `be4df16` - Backend URL fix
- `251ca75` - Documentation

---

## Summary

1. **Deploy Express** to Render (5 min)
2. **Set BACKEND_URL** in Vercel (1 min)
3. **Test** on vercel.app (1 min)

Total: **7 minutes** to production! 🚀

Questions? Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed explanations.
