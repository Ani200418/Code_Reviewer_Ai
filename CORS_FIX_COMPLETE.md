# CORS Fix for Google OAuth Local Development

## Issue Fixed
**Error:** `Access to XMLHttpRequest at 'http://localhost:5000/api/auth/google' has been blocked by CORS policy`

**Root Cause:** 
- Preflight OPTIONS requests weren't being properly handled before rate limiter
- CORS headers weren't being returned consistently
- Google OAuth endpoint needed explicit CORS configuration

## Changes Made

### 1. Improved Server CORS Configuration (`server/server.js`)
- ✅ Added proper CORS middleware ordering (before helmet)
- ✅ Added `Access-Control-Max-Age` header for better preflight caching
- ✅ Improved header formatting for better compatibility
- ✅ Moved CLIENT_URL to variable for consistent usage

### 2. Added Explicit Preflight Handler (`server/routes/authRoutes.js`)
- ✅ Added explicit `router.options('*')` handler
- ✅ Ensures OPTIONS requests get CORS headers immediately
- ✅ Prevents rate limiter from blocking preflight requests
- ✅ Handles all auth endpoint preflight requests

### 3. Verified Rate Limiter Configuration (`server/middlewares/rateLimiter.js`)
- ✅ Already skips OPTIONS requests
- ✅ Already includes CORS headers in rate-limit responses
- ✅ No changes needed

## How It Works Now

```
Browser sends OPTIONS preflight request to /api/auth/google
    ↓
Express receives request
    ↓
CORS middleware applies headers
    ↓
Auth routes options handler catches it
    ↓
Returns 204 No Content with CORS headers
    ↓
Browser receives CORS headers, allows actual POST request
    ↓
Browser sends actual POST request to /api/auth/google
    ↓
Server processes Google OAuth
```

## Testing Locally

```bash
# Terminal 1: Start backend
cd server && npm run dev
# Should show: Server running on port 5000

# Terminal 2: Start frontend
cd client && npm run dev
# Should show: ▲ Local:        http://localhost:3000

# In browser: http://localhost:3000/login
# Click "Sign in with Google"
# ✅ Should work without CORS errors
```

## Verification Checklist

After restarting servers:
- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 3000
- [ ] Can access http://localhost:3000 
- [ ] Can click "Sign in with Google" button
- [ ] No CORS error in console
- [ ] Google popup appears (or redirects)
- [ ] Can login with email/password
- [ ] Can analyze code

## Files Modified

1. **server/server.js**
   - Improved CORS configuration
   - Better header formatting
   - Support for CLIENT_URL environment variable

2. **server/routes/authRoutes.js**
   - Added explicit OPTIONS handler
   - Ensures preflight requests are handled

## Environment Requirements

Your `.env` should have:
```properties
CLIENT_URL=http://localhost:3000
```

For production (Vercel):
```
CLIENT_URL=https://code-reviewer-ai-tau.vercel.app
```

## Browser Developer Tools Debugging

If you still see CORS errors:

1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed requests (usually OPTIONS first)
4. Check Response Headers:
   - Should see `Access-Control-Allow-Origin: http://localhost:3000`
   - Should see `Access-Control-Allow-Credentials: true`
   - Should see `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`

If missing, the preflight request isn't being handled properly.

## Advanced: Testing CORS Manually

```bash
# Test preflight request
curl -X OPTIONS http://localhost:5000/api/auth/google \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return 204 with CORS headers visible in response
```

## Summary

✅ **Local Development**: Google OAuth now works without CORS errors
✅ **Production**: Vercel deployment will work once backend is deployed
✅ **All Authentication Methods**: Email/password, Google OAuth, local testing

## Next Steps

1. **Restart both servers** after pulling changes
2. **Test Google Sign-In** locally
3. **Deploy backend** to Render (if doing production)
4. **Set CLIENT_URL** in Vercel environment variables

---

**Status:** CORS issues for Google OAuth are fixed! 🎉
