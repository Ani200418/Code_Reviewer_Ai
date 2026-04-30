# Google OAuth Setup - Complete Guide

## Current Status

Your application is running on **port 5001** (not 5000). You're seeing Google OAuth errors because:

1. ✅ Server is on port 5001
2. ✅ Client is configured for port 5001
3. ✅ API fallbacks are set to 5001
4. ✅ Security headers fixed (COOP policy)
5. ❌ **Google OAuth not authorized for localhost:5001**

## The Problem

Error: `The given origin is not allowed for the given client ID`

This means Google's servers don't recognize `http://localhost:5001` as a valid origin for your Client ID.

## The Solution

You need to add `http://localhost:5001` to your Google OAuth configuration.

### Step 1: Go to Google Cloud Console

Open: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client

Look for: `553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com`

Click on it to edit.

### Step 3: Update Authorized Origins

**Current Configuration:**
```
http://localhost:3000
```

**Update to include:**
```
http://localhost:3000
http://localhost:5001
https://code-reviewer-ai-tau.vercel.app
```

**Note:** Remove `http://localhost:5000` if it exists (we're using 5001 now)

### Step 4: Update Authorized Redirect URIs

**Current Configuration (if any):**
```
http://localhost:3000
http://localhost:3000/login
```

**Update to include:**
```
http://localhost:3000
http://localhost:3000/login
http://localhost:5001
http://localhost:5001/api/auth/google
https://code-reviewer-ai-tau.vercel.app
https://code-reviewer-ai-tau.vercel.app/login
```

### Step 5: Save Changes

Click **"Save"** button at the bottom.

Google usually propagates changes within **1-2 minutes**.

### Step 6: Restart Your Application

Stop both servers (Ctrl+C) and restart:

**Terminal 1:**
```bash
cd server && npm run dev
```

**Terminal 2:**
```bash
cd client && npm run dev
```

### Step 7: Clear Browser Cache

- **Mac:** `Cmd + Shift + R` (hard refresh)
- **Windows:** `Ctrl + Shift + R`

Or manually:
1. Open DevTools (F12)
2. Settings → Disable cache (while DevTools open)
3. Refresh page

### Step 8: Test Google Sign-In

1. Go to http://localhost:5001 (or http://localhost:3000)
2. Click "Sign in with Google"
3. ✅ Should see Google popup (not 403 error)
4. Complete authentication
5. ✅ Should be logged in

## Current Configuration

Your app is configured as:

| Component | Port | URL | Status |
|-----------|------|-----|--------|
| Backend (Express) | 5001 | http://localhost:5001 | ✅ Running |
| Frontend (Next.js) | 3000 | http://localhost:3000 | ✅ Running |
| Google OAuth Client ID | - | 553107784810-... | ⏳ Needs update |

## What We Fixed Today

✅ Server port set to 5001
✅ Client API URLs set to 5001
✅ API fallbacks set to 5001
✅ Security headers (COOP) fixed
✅ CORS configuration improved

## What You Need to Do

1. Add `http://localhost:5001` to Google Cloud Console
2. Restart servers
3. Hard refresh browser
4. Test Google Sign-In

## If It Still Doesn't Work

### Check Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth Client ID
3. Verify **Authorized JavaScript origins** includes:
   - `http://localhost:3000`
   - `http://localhost:5001` ← **This is the new one**
4. Verify **Authorized redirect URIs** includes:
   - `http://localhost:5001/api/auth/google`

### Check Browser Console

1. Open DevTools (F12)
2. Look for errors containing "origin"
3. Take a screenshot and verify the origin matches your configuration

### Check Server Logs

In your backend terminal, you should see:
```
GET /api/auth/me - success
POST /api/auth/google - processing
```

If you see errors, the server is receiving requests properly.

### Wait for Propagation

Google takes 1-2 minutes to propagate changes. If it's been less than 2 minutes:
1. Wait a bit longer
2. Hard refresh browser again
3. Try a different browser

## Port Summary

⚠️ **Important:** We changed from port 5000 to 5001

**Files affected:**
- `server/.env` → `PORT=5001`
- `client/.env` → `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- `client/lib/api.ts` → fallback to `localhost:5001/api`
- `client/next.config.js` → fallback to `localhost:5001`
- **Google Cloud Console** → Need to add `localhost:5001` (THIS IS YOUR NEXT STEP)

## Testing Checklist

- [ ] Backend running on port 5001 (check terminal output)
- [ ] Frontend running on port 3000 (check terminal output)
- [ ] Google Cloud Console updated with `http://localhost:5001`
- [ ] Waited 2 minutes for Google propagation
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Cleared browser cache
- [ ] Can access http://localhost:3000
- [ ] Can click "Sign in with Google" button
- [ ] No 403 error from Google
- [ ] Google popup appears
- [ ] Can complete authentication

## Summary

Your application is ready! You just need to:

1. **Add `http://localhost:5001` to Google Cloud Console** (3 minutes)
2. **Restart servers** (30 seconds)
3. **Hard refresh browser** (10 seconds)
4. **Test Google Sign-In** (1 minute)

**Total time: ~5 minutes** ⏱️

---

**Status:** ✅ Backend configured for 5001
**Status:** ✅ Frontend configured for 5001
**Status:** ✅ Security headers fixed
**Status:** ⏳ Waiting for Google OAuth origin authorization

Go update Google Cloud Console now! 🎉
