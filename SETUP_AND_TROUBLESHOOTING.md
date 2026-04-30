# 🚀 AI Code Reviewer - Setup & Troubleshooting Guide

## ⚠️ Critical Issue Resolved: Multi-AI Fallback System

### What Was Fixed
The system now properly implements a **multi-provider fallback mechanism** with three AI services:
1. **OpenAI** (GPT-4o-mini) - Premium, requires API credit
2. **Google Gemini** (Free tier available) - Fast with generous free limits
3. **Groq** (Mixtral-8x7b) - Free tier with 100K tokens/day

### The Error You Were Getting
```
All AI services are temporarily unavailable (likely quota limits).
Please wait a few minutes and try again, or check your API keys.
Details: Groq: empty/null response | OpenAI: empty/null response | Gemini: empty/null response
```

**Causes:**
- No API keys configured or all invalid
- Rate limits exceeded on all three services
- API services temporarily down
- Invalid API key formats

---

## 📋 Setup Steps

### Step 1: Get API Keys

#### Option A: Free Tier (Recommended for Testing)
Choose at least ONE of these:

**Google Gemini (Free - Recommended):**
1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create a new project (or use existing)
4. Copy the API key
5. Set `GOOGLE_API_KEY=AIzaSy...` in `.env`
- Free tier: Up to 60 requests/minute
- Perfect for development

**Groq (Free - Very Fast):**
1. Go to https://console.groq.com
2. Sign up or login
3. Create API key in Settings
4. Copy the key
5. Set `GROQ_API_KEY=gsk_...` in `.env`
- Free tier: 100K tokens/day (about 1000 code reviews)
- Extremely fast (2-3 seconds per analysis)

#### Option B: Premium Tier
**OpenAI (GPT-4o-mini):**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Set `OPENAI_API_KEY=sk-...` in `.env`
- Costs money ($0.15 per 1M input tokens)
- Best quality analysis
- Recommended for production

### Step 2: Configure Environment

**For Server:**
```bash
cd server
cp .env.example .env
# Edit .env and add at least one API key
nano .env
```

**Example .env (using free services):**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key

# Use FREE services first
GOOGLE_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
```

**For Client:**
```bash
cd client
cp .env.example .env.local  # if exists, or create one
# Add:
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies

```bash
cd /path/to/ai-code-reviewer-v2

# Install both client and server
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### Step 4: Start the Project

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
# Should output: ✅ MongoDB connected
#                🚀 CodeReviewerAI API — by Aniket Singh
```

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
# Should output: ▲ Next.js X.X.X
#                > Local: http://localhost:3000
```

### Step 5: Test the System

1. Open http://localhost:3000
2. Login or create account
3. Paste some code (JavaScript, Python, etc.)
4. Click "Analyze Code"
5. Wait 2-5 seconds for analysis

---

## 🔧 Troubleshooting

### "All AI services are temporarily unavailable"

**Check 1: Are any API keys configured?**
```bash
cd server
cat .env | grep -E "OPENAI_API_KEY|GOOGLE_API_KEY|GROQ_API_KEY"
```
If empty, you need to add at least one API key.

**Check 2: Are API keys valid format?**
- OpenAI: starts with `sk-`
- Google: starts with `AIzaSy`
- Groq: starts with `gsk_`

**Check 3: API Key Validity**
Test each API individually:

```bash
# Test OpenAI
node << 'EOF'
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'test' }],
  max_tokens: 10
}).then(() => console.log('✅ OpenAI OK')).catch(e => console.log('❌', e.message));
EOF

# Test Google Gemini
node << 'EOF'
const { GoogleGenerativeAI } = require('@google/generative-ai');
const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
model.generateContent('test').then(() => console.log('✅ Gemini OK')).catch(e => console.log('❌', e.message));
EOF
```

**Check 3: Rate Limits Exceeded?**
- If using free tier, you may have hit daily/hourly limits
- Free tiers reset after specific periods:
  - **Google Gemini**: 60 requests/minute, daily limit ~1000
  - **Groq**: 100K tokens/day (resets daily)
  - **OpenAI**: No rate limit on paid accounts

**Check 4: MongoDB Connection**
```bash
# Check if MongoDB is running
# Server logs should show: ✅ MongoDB connected

# If not, configure MONGODB_URI in .env
# Get free MongoDB: https://mongodb.com/cloud/atlas
```

### Generic/Repetitive Responses

**Issue:** All analyses say similar things like "Consider using arrow functions", "Add type hints", etc.

**Causes:**
1. Weak prompt engineering (FIXED in this version)
2. AI models defaulting to generic suggestions
3. Insufficient context in prompts

**Solution:** The new version includes:
- Specific prompt that demands code-specific analysis
- Validation to catch generic responses
- Better field mapping for AI variations
- Shorter, more focused prompts for consistency

### Slow Analysis (>10 seconds)

**Likely causes:**
1. Using OpenAI instead of Groq (Groq: 2-3s, OpenAI: 5-8s)
2. Network latency
3. Large code files (>5000 lines)

**Solutions:**
- Switch to Groq: `GROQ_API_KEY=gsk_...`
- Make sure `NODE_ENV=development` (not production)
- Keep code snippets under 3000 lines

### Empty/Null Response Error

**Cause:** API returned an empty response (service issue or API quota hit)

**What to do:**
1. Try again in a few seconds
2. Check if you've hit rate limits
3. Switch to different API service
4. Check server logs for detailed errors

---

## 📊 API Endpoints Reference

### Code Review
```bash
POST /api/review-code
Content-Type: application/json
Authorization: Bearer {token}

{
  "code": "function test() { return 1; }",
  "language": "javascript",
  "fileName": "test.js"
}

Response:
{
  "success": true,
  "message": "Code analysis complete",
  "data": {
    "reviewId": "...",
    "aiResponse": {
      "bugs": [...],
      "optimizations": [...],
      "explanation": "...",
      "edge_cases": [...],
      "test_cases": [...],
      "score": {
        "overall": 75,
        "readability": 80,
        "efficiency": 70,
        "best_practices": 75
      }
    }
  }
}
```

### Upload Code File
```bash
POST /api/upload-code
Authorization: Bearer {token}
(form-data)
file: [binary file]

Response: Same as above
```

### Get Reviews
```bash
GET /api/reviews?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": { "current": 1, "total": 5, "totalReviews": 50 }
  }
}
```

---

## 🎯 Recommended Configuration

### For Development (Free):
```env
GOOGLE_API_KEY=AIzaSy...  # Primary (60 req/min)
GROQ_API_KEY=gsk_...       # Fallback (100K tokens/day)
```

### For Small Production (<100/day):
```env
GROQ_API_KEY=gsk_...       # Primary (100K tokens/day)
GOOGLE_API_KEY=AIzaSy...   # Fallback
```

### For High-Volume Production:
```env
OPENAI_API_KEY=sk-...      # Primary (unlimited, costs $)
GOOGLE_API_KEY=AIzaSy...   # Fallback 1
GROQ_API_KEY=gsk_...       # Fallback 2
```

---

## 📈 Performance Expectations

| Service | Speed | Quality | Cost | Limit |
|---------|-------|---------|------|-------|
| Groq | 2-3s | Good | Free | 100K tokens/day |
| Gemini | 3-4s | Good | Free | 60 req/min |
| OpenAI | 5-8s | Excellent | $0.15/M | Unlimited |

---

## 🚀 Deployment

### To Vercel (Client):
```bash
cd client
vercel --prod
# Set env vars in Vercel dashboard:
# - NEXT_PUBLIC_API_URL=https://your-api.com/api
```

### To Render/Railway (Server):
```bash
# Push to GitHub and connect repo
# Set environment variables:
MONGODB_URI=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
JWT_SECRET=...
CLIENT_URL=https://your-frontend.vercel.app
```

---

## ✅ Final Checklist

- [ ] At least one API key configured in `.env`
- [ ] MongoDB URI configured
- [ ] `npm install` completed in both folders
- [ ] Server starts with `npm run dev` (shows ✅ MongoDB)
- [ ] Client starts with `npm run dev` (shows Local URL)
- [ ] Can login/signup
- [ ] Can paste code and get analysis
- [ ] Analysis is specific to code (not generic)

---

## 💬 Need Help?

1. Check server logs: Terminal running `npm run dev`
2. Check browser console: F12 → Console tab
3. Test individual APIs using provided curl examples
4. Check MongoDB connection status
5. Verify API key format and validity

**Remember:** System needs at least ONE valid API key to work!
