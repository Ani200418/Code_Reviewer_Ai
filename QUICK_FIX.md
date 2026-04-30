# Quick Fix Guide - AI Code Reviewer

## Problem Summary
The system was showing: "All AI services are temporarily unavailable (likely quota limits). Please wait a few minutes and try again, or check your API keys."

## Root Causes Fixed
1. ✅ Only OpenAI was implemented, but no API keys were configured
2. ✅ Missing fallback to Groq and Gemini APIs
3. ✅ Generic responses (all analyses were identical)
4. ✅ Poor error handling and reporting
5. ✅ Missing environment configuration examples

## What Changed

### 1. Multi-API Fallback System (IMPLEMENTED)
**File:** `/server/utils/aiService.js`

The system now tries APIs in this order:
1. OpenAI (if `OPENAI_API_KEY` is set)
2. Groq (if `GROQ_API_KEY` is set)  
3. Google Gemini (if `GOOGLE_API_KEY` is set)

If one fails, it automatically tries the next one.

### 2. Environment Configuration (CREATED)
**Files:**
- `/server/.env.example` - Template with all required variables
- `/client/.env.example` - Client configuration template

### 3. Better Error Messages (IMPROVED)
- Shows which services are configured
- Tells you exactly which API failed and why
- Provides actionable troubleshooting steps

### 4. Generic Response Fix (IMPROVED)
- Rewrote prompt to demand code-specific analysis
- Added stricter requirements for test cases and edge cases
- Better field mapping to handle different AI response formats

### 5. Test Script (CREATED)
**File:** `/server/test-apis.js`

Test your API configuration:
```bash
cd server
npm run test:apis
```

---

## Getting Started (3 Easy Steps)

### Step 1: Get a Free API Key (Choose One)

**Option A: Google Gemini (Easiest)**
1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create new project
4. Copy the key (looks like `AIzaSy...`)

**Option B: Groq (Fastest)**
1. Go to https://console.groq.com
2. Sign up
3. Go to Settings → API Keys
4. Create new key (looks like `gsk_...`)

**Option C: OpenAI (Best Quality)**
1. Go to https://platform.openai.com
2. Create API key (looks like `sk-...`)
3. **Note:** Requires paid credits ($5+)

### Step 2: Configure the Server

```bash
cd /path/to/ai-code-reviewer-v2/server

# Create .env file from template
cp .env.example .env

# Edit .env and paste your API key(s)
# For Google Gemini:
#   GOOGLE_API_KEY=AIzaSy...
# For Groq:
#   GROQ_API_KEY=gsk_...
# For OpenAI:
#   OPENAI_API_KEY=sk-...

nano .env  # or use your editor
```

Example `.env` (using Google Gemini):
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-code-reviewer
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-random-secret-key

GOOGLE_API_KEY=AIzaSy...
```

### Step 3: Start the Project

```bash
# Terminal 1 - Server
cd server
npm run dev
# Should show: ✅ MongoDB connected
#              🚀 CodeReviewerAI API

# Terminal 2 - Client
cd client
npm run dev
# Should show: ▲ Next.js
#              Local: http://localhost:3000
```

---

## Test Everything Works

### Quick Test
```bash
cd server
npm run test:apis
```

You should see:
```
✅ OpenAI: Working      (or ❌/⚠️ if not configured)
✅ Gemini: Working      (or ❌/⚠️ if not configured)
✅ Groq: Working        (or ❌/⚠️ if not configured)
```

### Full System Test
1. Open http://localhost:3000
2. Sign up / Login
3. Paste this code:
```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```
4. Click "Analyze Code"
5. Wait 2-5 seconds

Expected result should show:
- ✅ Specific bugs (e.g., "Recursive fibonacci is inefficient for large n")
- ✅ Specific optimizations (e.g., "Use memoization or dynamic programming")
- ✅ Proper scoring (e.g., "Efficiency: 40/100" - not generic 75)
- ✅ Real test cases for THIS code

---

## Troubleshooting

### "All AI services are temporarily unavailable"

**Check 1: API Key Set?**
```bash
grep -E "OPENAI_API_KEY|GOOGLE_API_KEY|GROQ_API_KEY" server/.env
```
Should show at least one key. If empty, run `npm run test:apis` again after adding key.

**Check 2: API Key Valid?**
```bash
cd server
npm run test:apis
```

Look for:
- ✅ = API working
- ❌ = Invalid key or service down
- ⚠️  = Rate limit exceeded

**Check 3: MongoDB Connected?**
Server logs should show:
```
✅ MongoDB connected
```

If not, check `MONGODB_URI` in .env

### Generic/Repetitive Responses

If responses say the same thing for different code:

1. **Wrong:** "Consider using arrow functions" for ALL code
2. **Right:** "Replace callback-style promises with async/await in this handler function"

This should be fixed now. If still happening:

1. Clear browser cache
2. Try different code samples
3. Check server logs for errors:
```bash
# Terminal running "npm run dev" should show analysis attempts
```

### Slow Analysis (>10 seconds)

1. Switch to Groq (fastest: 2-3 seconds)
2. Check internet connection
3. Try smaller code samples (< 1000 lines)

---

## File Changes Summary

### Modified Files
- `server/utils/aiService.js` - Multi-API support with Groq + Gemini
- `server/middlewares/errorHandler.js` - Better error messages
- `server/package.json` - Added test:apis script

### New Files
- `server/.env.example` - Configuration template
- `server/test-apis.js` - API testing utility
- `client/.env.example` - Client config template
- `SETUP_AND_TROUBLESHOOTING.md` - Full documentation
- `QUICK_FIX.md` - This file

---

## Next Steps

1. ✅ Add API key to `server/.env`
2. ✅ Run `npm run test:apis` to verify
3. ✅ Start both server and client
4. ✅ Test with sample code
5. ✅ Enjoy accurate code reviews!

---

## Support

If issues persist:

1. Check server logs (Terminal 1)
2. Check browser console (F12)
3. Run `npm run test:apis` for diagnostics
4. Check SETUP_AND_TROUBLESHOOTING.md for detailed guide

**Remember:** The system needs at least ONE valid API key to work!
