# CORS Error Troubleshooting - Google OAuth

## The Problem
You're still getting CORS errors on the Google OAuth endpoint even after the fixes were applied.

## The Solution
**You need to RESTART your server** for the code changes to take effect.

### Step 1: Stop Both Servers

In **both terminal windows**, press:
```
Ctrl + C
```

Wait for both processes to fully stop (you should see the terminal prompt return).

### Step 2: Pull the Latest Changes

```bash
cd /Users/aniketsingh/ai-code-reviewer-v2
git pull origin main
```

You should see:
```
Updating d78477c..ea85af4
Fast-forward
 CORS_FIX_COMPLETE.md      | 132 +++++++++++++++++++++++++++++++
 server/routes/authRoutes.js |  20 +++--
 server/server.js           |  30 ++++---
 3 files changed, ...
```

### Step 3: Clear Node Modules Cache (Optional but Recommended)

```bash
# Clear npm cache
npm cache clean --force

# Or restart your terminal completely (close and reopen)
```

### Step 4: Restart Both Servers

**Terminal 1:**
```bash
cd /Users/aniketsingh/ai-code-reviewer-v2/server
npm run dev
```

You should see:
```
✓ Server running on port 5000
✓ MongoDB connected
✓ App listening on http://localhost:5000
```

**Terminal 2 (new terminal):**
```bash
cd /Users/aniketsingh/ai-code-reviewer-v2/client
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

### Step 5: Clear Browser Cache

In your browser, do a **hard refresh**:
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`

Or manually clear:
1. Open DevTools (F12)
2. Settings → Disable cache (while DevTools open)
3. Refresh page (Cmd+R or Ctrl+R)

### Step 6: Test Google Sign-In

1. Go to http://localhost:3000
2. Click "Sign in with Google"
3. You should **NOT** see the CORS error anymore

## If You Still Get CORS Errors

### Checklist:
- [ ] Both servers fully stopped (Ctrl+C received)
- [ ] Ran `git pull origin main` and saw the changes
- [ ] Restarted backend first (on port 5000)
- [ ] Restarted frontend second (on port 3000)
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Cleared browser cache completely
- [ ] Checked DevTools Network tab (see details below)

### Debug in DevTools

**If error persists:**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "Sign in with Google"
4. Look for failed request (should see OPTIONS request first)
5. Click on the OPTIONS request
6. Go to **Response Headers** tab
7. Check if these headers exist:
   - `Access-Control-Allow-Origin: http://localhost:3000`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`

**If headers are missing:** Server didn't restart properly
**If headers are there:** Something else is blocking (try different browser)

### Terminal Commands to Verify

```bash
# Check if backend is running on 5000
lsof -i :5000

# Should show something like:
# COMMAND   PID    USER   FD   TYPE     DEVICE SIZE/OFF NODE NAME
# node    12345 aniket   20u  IPv6 0x12345abc 0t0      TCP *:5000 (LISTEN)

# Check if frontend is running on 3000
lsof -i :3000

# Check git changes were pulled
cd /Users/aniketsingh/ai-code-reviewer-v2
git log --oneline -5
# Should show: ea85af4 Fix: Resolve CORS errors on Google OAuth endpoint
```

## What Changed

These files were updated with CORS fixes:

**1. server/server.js**
- Moved CORS middleware before helmet
- Added proper header ordering
- Added preflight handling

**2. server/routes/authRoutes.js**
- Added explicit OPTIONS handler
- Ensures all auth endpoints handle preflight

**3. New documentation**
- CORS_FIX_COMPLETE.md

## Expected Behavior After Fix

✅ Click "Sign in with Google"
✅ Google popup appears (no CORS error)
✅ Or redirects to Google login
✅ Can complete authentication
✅ Logged in successfully

## Common Issues

### "Port 5000 is already in use"
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>

# Then restart
npm run dev
```

### "Cannot find module" errors
```bash
# Reinstall dependencies
npm install

# Then try again
npm run dev
```

### Changes not appearing
```bash
# Verify you're on the right branch
git status
git log --oneline -1

# Should show commit: ea85af4 Fix: Resolve CORS errors on Google OAuth endpoint
```

### Still seeing "net::ERR_FAILED"
This usually means:
1. Backend is not running
2. Backend is on wrong port
3. Backend crashed silently

**Check:**
```bash
# Is backend listening on 5000?
lsof -i :5000

# Is frontend trying to reach it?
# In browser DevTools Network tab, check the request URL:
# Should be: http://localhost:5000/api/auth/google
```

## Summary

| Issue | Fix | Status |
|-------|-----|--------|
| CORS preflight not handled | Rewrite CORS middleware | ✅ Done |
| Auth routes not handling OPTIONS | Add explicit OPTIONS handler | ✅ Done |
| Server not using new code | Restart server | ⏳ Do this now |
| Browser using old code | Hard refresh + clear cache | ⏳ Do this now |

---

**Next Steps:**
1. Stop both servers (Ctrl+C)
2. Pull latest: `git pull origin main`
3. Restart backend: `npm run dev` (in server folder)
4. Restart frontend: `npm run dev` (in client folder)
5. Hard refresh browser (Cmd+Shift+R)
6. Test Google Sign-In

**The fix is already implemented and committed!** You just need to restart the servers. 🚀
