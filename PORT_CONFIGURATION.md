# Port Configuration Summary

## All Files Configured for Port 5000 ✅

All ports are now consistent and set to **5000** across all environments:

### Server Configuration
- **File:** `/server/.env`
- **Setting:** `PORT=5000`
- **Status:** ✅ Verified

### Client Development
- **File:** `/client/.env`
- **Setting:** `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- **Status:** ✅ Verified

### Client API Client
- **File:** `/client/lib/api.ts`
- **Fallback:** `http://localhost:5000/api`
- **Status:** ✅ Verified

### Next.js Rewrites
- **File:** `/client/next.config.js`
- **Fallback:** `http://localhost:5000`
- **Status:** ✅ Verified

### AuthContext
- **File:** `/client/lib/context/AuthContext.tsx`
- **Cookie Settings:** `sameSite: 'lax'`
- **Status:** ✅ Verified

## How to Run

```bash
# Terminal 1: Start Backend on Port 5000
cd server
npm run dev

# Terminal 2: Start Frontend on Port 3000
cd client
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Next.js development server at http://localhost:3000
```

## Port Mapping

| Component | Port | Status |
|-----------|------|--------|
| Express Backend | 5000 | ✅ Ready |
| Next.js Frontend | 3000 | ✅ Ready |
| MongoDB | Remote (Atlas) | ✅ Configured |

## Next Steps

1. **Restart Both Servers**
   - Stop all running servers (Ctrl+C)
   - Start backend: `cd server && npm run dev`
   - Start frontend: `cd client && npm run dev`

2. **Test Locally**
   - Go to http://localhost:3000
   - Login/Signup
   - Test analyze button (should NOT logout)
   - Test Google Sign-In

3. **Authorize Google OAuth** (if needed)
   - Go to https://console.cloud.google.com/apis/credentials
   - Add authorized origins:
     - `http://localhost:3000`
     - `http://localhost:5000`
     - `https://code-reviewer-ai-tau.vercel.app`

4. **Deploy to Production** (optional)
   - Follow `QUICK_START_PRODUCTION.md`
   - Deploy backend to Render/Railway
   - Set `BACKEND_URL` in Vercel

## Troubleshooting

**Port still in use?**
```bash
# Find process on port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

**Requests still failing?**
1. Hard refresh browser (Cmd+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Check server logs for errors
4. Check DevTools Network tab for request/response

**Still getting 401 errors?**
1. Verify server is on port 5000 (check terminal output)
2. Check Authorization header in Network tab
3. Verify JWT_SECRET is the same everywhere
4. Check server logs for auth errors

---

**All configurations verified and consistent!** 🎉
