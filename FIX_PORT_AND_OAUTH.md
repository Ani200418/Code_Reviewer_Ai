# Fix Google OAuth & Port Configuration Issues

## Critical Issues Found

### Issue 1: Server Running on Port 5001 (Not 5000)
Your `server/.env` has `PORT=5001`, but we configured everything for port 5000!

**This causes:**
- All API calls fail (wrong port)
- 401 errors on analyze button
- Logout issues

**Fix:** Change `PORT=5001` to `PORT=5000`

### Issue 2: Google OAuth Origin Not Authorized
Error: `The given origin is not allowed for the given client ID`

**This means:**
- Your Vercel domain `https://code-reviewer-ai-tau.vercel.app` is NOT authorized
- Also localhost:3000 might not be authorized
- Google OAuth won't work on either environment

**Fix:** Add authorized origins to Google Cloud Console

---

## Step-by-Step Fixes

### Fix #1: Update Server Port (2 seconds)

Edit `/server/.env`:

```properties
# CHANGE THIS:
PORT=5001

# TO THIS:
PORT=5000
```

**Why:** Everything is configured for port 5000. The fallback URL in api.ts now points to 5000. The client rewrites point to backend on port 5000.

---

### Fix #2: Authorize Google OAuth Origins (3 minutes)

**Step 1: Go to Google Cloud Console**
```
https://console.cloud.google.com/apis/credentials
```

**Step 2: Find Your OAuth 2.0 Client ID**
- Click on the Client ID: `553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com`

**Step 3: Add Authorized Origins**
In the "Authorized JavaScript origins" section, add:

```
http://localhost:3000
http://localhost:5000
https://code-reviewer-ai-tau.vercel.app
```

**Step 4: Add Authorized Redirect URIs**
In the "Authorized redirect URIs" section, add:

```
http://localhost:3000
http://localhost:3000/login
http://localhost:5000
http://localhost:5000/api/auth/google
https://code-reviewer-ai-tau.vercel.app
https://code-reviewer-ai-tau.vercel.app/login
```

**Step 5: Click Save**

**Step 6: Clear Browser Cache**
- Open DevTools (F12)
- Settings → Disable cache (while DevTools open)
- Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Step 7: Test**
- Local: http://localhost:3000 → Click "Sign in with Google"
- Production: https://code-reviewer-ai-tau.vercel.app → Click "Sign in with Google"

---

## Updated Environment Files

### `/server/.env` (Fix the Port)
```properties
# Server Configuration
PORT=5000  # ← CHANGED FROM 5001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-code-reviewer?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=<your-jwt-secret-here>
JWT_EXPIRES_IN=7d

# OpenAI API
OPENAI_API_KEY=<your-openai-api-key-here>
OPENAI_MODEL=gpt-4o

# CORS Origin
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=20

# Google OAuth
GOOGLE_CLIENT_ID=553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret-here>
```

### `/client/.env` (Already Correct)
```properties
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
```

### `/client/.env.production` (Already Correct)
```properties
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=https://your-backend-name.onrender.com
NEXT_PUBLIC_APP_URL=https://code-reviewer-ai-tau.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=553107784810-psuace3rqccfjm97q7bc2mq90on8j63k.apps.googleusercontent.com
```

---

## Testing Checklist

### Local Development (after fixes)
- [ ] Server running on port 5000: `npm run dev` shows "Server running on port 5000"
- [ ] Client running on port 3000: http://localhost:3000 loads
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google Sign-In works (no "origin not allowed" error)
- [ ] Can analyze code without logout
- [ ] Can upload files
- [ ] Can view history

### Production (on Vercel)
- [ ] Backend deployed to Render/Railway
- [ ] BACKEND_URL set in Vercel
- [ ] Google OAuth origins authorized
- [ ] Can login with email/password
- [ ] Can login with Google
- [ ] Can analyze code
- [ ] No 401 errors

---

## Why These Issues Happened

### Port 5001 in .env
- Likely a mistake during initial setup
- Server was never listening on 5001
- All requests to 5001 fail silently

### Google OAuth Origins
- New origins need explicit authorization
- Vercel domain is new, wasn't in the list
- localhost might have been missed initially

---

## Quick Reference: All Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Express Backend | 5000 | http://localhost:5000 | API server |
| Next.js Frontend | 3000 | http://localhost:3000 | React app |
| MongoDB | 27017 | (remote) | Database |

All configured for these ports. Port 5001 in .env was the mistake.

---

## After Making Changes

1. **Stop both servers** (Ctrl+C in both terminals)
2. **Edit `/server/.env`** - Change PORT from 5001 to 5000
3. **Authorize Google OAuth** - Add origins in Google Cloud Console
4. **Restart servers:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   cd client && npm run dev
   ```
5. **Clear browser cache** - Hard refresh (Cmd+Shift+R)
6. **Test** - Everything should work now

---

## If You Get More Google OAuth Errors

1. **Clear localStorage and cookies:**
   ```javascript
   // Run in browser console
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.split("=")[0] + "=; Max-Age=0";
   });
   location.reload();
   ```

2. **Check Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials
   - Click your OAuth 2.0 Client ID
   - Verify all origins are listed
   - Click "Save" if you made changes

3. **Check Network Tab (DevTools):**
   - F12 → Network tab
   - Click "Sign in with Google"
   - Look for requests to `accounts.google.com`
   - Check response for error message
   - Take screenshot and report the exact error

---

## Summary

🔴 **Critical:** Server is on port 5001, everything expects 5000
🟡 **Important:** Google OAuth not authorized for your Vercel domain
🟢 **After fixes:** Everything will work locally and on production

**Time to fix:** 5 minutes
**Steps:** 
1. Edit server/.env (change 5001→5000)
2. Google Cloud Console (add authorized origins)
3. Restart servers and test
