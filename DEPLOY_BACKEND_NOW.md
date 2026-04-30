# 🚀 Deploy Backend to Production - 5 Minute Guide

## The Problem
Your Vercel frontend is working, but it can't reach the backend server. That's why you get **401 Unauthorized** on `/api/review-code`.

## The Solution
Deploy the Express backend to Render (free tier available, takes 5 minutes).

---

## Step 1: Create Render Account (1 min)

Go to: **https://render.com**

Click "Sign Up" → Create account with GitHub or email

---

## Step 2: Create New Web Service (1 min)

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select **"Deploy an existing repository"**
3. Search for your repo: `Code_Reviewer_Ai`
4. Click **"Connect"** to authorize Render access to your GitHub

---

## Step 3: Configure Service (1 min)

| Field | Value |
|-------|-------|
| **Name** | `ai-code-reviewer-api` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install && cd server && npm install` |
| **Start Command** | `cd server && npm start` |

Leave other settings default.

---

## Step 4: Add Environment Variables (2 min)

Click **"Add Environment Variable"** for each:

```
NODE_ENV = production
PORT = 5000
MONGODB_URI = <your-mongodb-connection-string>
JWT_SECRET = <your-jwt-secret>
JWT_EXPIRES_IN = 7d
OPENAI_API_KEY = <your-openai-api-key>
OPENAI_MODEL = gpt-4o
GOOGLE_CLIENT_ID = <your-google-client-id>
GOOGLE_CLIENT_SECRET = <your-google-client-secret>
CLIENT_URL = https://code-reviewer-ai-tau.vercel.app
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
AI_RATE_LIMIT_MAX = 20
```

**Get these values from your `.env` file:**
- `MONGODB_URI` - from server/.env
- `JWT_SECRET` - from server/.env
- `OPENAI_API_KEY` - from server/.env
- `GOOGLE_CLIENT_ID` - from server/.env
- `GOOGLE_CLIENT_SECRET` - from server/.env

---

## Step 5: Deploy (1 min)

Click **"Create Web Service"** and wait 5-10 minutes for deployment.

You'll see logs showing the build process. Wait for:
```
✓ Deployed
Service is live at: https://ai-code-reviewer-api-xxxx.onrender.com
```

**Copy your service URL** (e.g., `https://ai-code-reviewer-api-xxxx.onrender.com`)

---

## Step 6: Set Backend URL in Vercel (1 min)

Go to: **https://vercel.com/dashboard**

1. Click your **`ai-code-reviewer-v2`** project
2. Go to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. **Name:** `BACKEND_URL`
5. **Value:** `https://ai-code-reviewer-api-xxxx.onrender.com` (your Render URL from Step 5)
6. **Environments:** Select all (Production, Preview, Development)
7. Click **"Save"**

---

## Step 7: Redeploy Vercel (1 min)

Go back to **Deployments** tab in Vercel:

1. Click the latest deployment
2. Click **"Redeploy"**
3. Wait for redeployment to complete

---

## Step 8: Test Production (2 min)

Go to: **https://code-reviewer-ai-tau.vercel.app**

1. ✅ Can you login?
2. ✅ Can you access dashboard?
3. ✅ Can you analyze code (no 401 error)?
4. ✅ Can you see review history?

If all ✅, you're done! 🎉

---

## Troubleshooting

### "Service is still spinning up"
- Render free tier has cold starts (takes 30+ seconds first time)
- This is normal - wait a bit longer
- Subsequent requests will be faster

### Still getting 401 after deploying backend
1. Verify `BACKEND_URL` is set in Vercel → **Settings** → **Environment Variables**
2. Check value matches your Render service URL (no trailing slash)
3. Hard refresh browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
4. Wait 1 minute for cache to clear

### Backend deployment failed
1. Check Render deployment logs for errors
2. Verify all required environment variables are set
3. Check MongoDB connection string is correct
4. Common issues:
   - Missing environment variables
   - MongoDB whitelist doesn't include Render IP (add 0.0.0.0 for all IPs)
   - Invalid API keys

### Backend is running but Vercel still can't reach it
1. Test backend directly:
   ```bash
   curl https://your-render-url/api/health
   # Should return 200 OK or 404 (not 502 or timeout)
   ```
2. Check Vercel function logs (Deployments → Logs)
3. Verify BACKEND_URL in Vercel has no `/api` at the end

---

## Architecture After Deployment

```
Your Vercel App (code-reviewer-ai-tau.vercel.app)
    ↓
Next.js Rewrite (/api/* → BACKEND_URL)
    ↓
Render Express Server (ai-code-reviewer-api-xxxx.onrender.com)
    ↓
MongoDB Atlas (Cloud Database)
```

All requests go through your Vercel app as same-origin, eliminating CORS issues!

---

## Summary

| Step | Time | What Happens |
|------|------|--------------|
| 1-2 | 2 min | Create Render account & Web Service |
| 3 | 1 min | Configure Node app settings |
| 4 | 2 min | Add environment variables |
| 5 | 5 min | Deploy (wait for completion) |
| 6 | 1 min | Set BACKEND_URL in Vercel |
| 7 | 2 min | Redeploy Vercel |
| 8 | 2 min | Test everything works |
| **Total** | **15 min** | **Production is live!** |

---

## Next Steps

After successful deployment:

1. ✅ Test production thoroughly
2. ✅ Monitor Render logs for any errors
3. ✅ Check Vercel analytics for traffic
4. ✅ Keep API keys secure (already done)
5. ✅ Set up error tracking (optional)

---

**Status:** Your frontend is live and working. Just need to deploy the backend! 🚀
