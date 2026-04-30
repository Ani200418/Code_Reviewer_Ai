# 🔧 Advanced Debugging Guide

## Understanding the Error

### Error Message Analysis
```
"All AI services are temporarily unavailable (likely quota limits).
Please wait a few minutes and try again, or check your API keys.
Details: Groq: empty/null response | OpenAI: empty/null response | Gemini: empty/null response"
```

This error means:
1. System tried to use Groq → Failed
2. System tried to use OpenAI → Failed
3. System tried to use Gemini → Failed
4. All services exhausted, returned error

### Why This Happens

| Reason | Fix |
|--------|-----|
| No API keys configured | Add keys to `.env` |
| API keys are invalid/malformed | Verify key format and expiration |
| Rate limits exceeded | Wait for reset or upgrade tier |
| API services temporarily down | Use different service or wait |
| Wrong model name | Check OPENAI_MODEL in .env |
| Network connectivity issue | Check internet connection |

---

## Detailed Diagnostic Steps

### Step 1: Check Configuration

**List all environment variables:**
```bash
cd server
cat .env | grep -E "KEY|API|MONGO"
```

**Expected output:**
```
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
# OR
GROQ_API_KEY=gsk_...
# OR  
GOOGLE_API_KEY=AIzaSy...
```

**If no keys shown:**
```bash
# Create .env if missing
cp .env.example .env
nano .env  # Add your API key
```

### Step 2: Verify API Key Formats

**OpenAI:**
- Starts with `sk-`
- Length: ~48 characters
- Example: `sk-proj-abc123xyz789`

**Groq:**
- Starts with `gsk_`
- Length: ~100+ characters
- Example: `gsk_abc123xyz789...`

**Google Gemini:**
- Starts with `AIzaSy`
- Length: ~39 characters
- Example: `AIzaSy_abc123xyz789_...`

**Check your keys:**
```bash
cd server
node << 'EOF'
require('dotenv').config();
console.log('OpenAI key format:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('Groq key format:', process.env.GROQ_API_KEY?.substring(0, 10) + '...');
console.log('Google key format:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');
EOF
```

### Step 3: Test Each API Individually

**Test OpenAI:**
```bash
cd server
node << 'EOF'
const OpenAI = require('openai');

async function test() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    console.log('Testing OpenAI...');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say hello in 5 words' }],
    });
    console.log('✅ OpenAI is working!');
    console.log('Response:', response.choices[0].message.content);
  } catch (err) {
    console.log('❌ OpenAI error:', err.message);
    if (err.status === 401) console.log('   → Check API key validity');
    if (err.status === 429) console.log('   → You have hit the rate limit');
  }
}

test().catch(console.error);
EOF
```

**Test Gemini:**
```bash
cd server
node << 'EOF'
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  try {
    console.log('Testing Gemini...');
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say hello in 5 words');
    console.log('✅ Gemini is working!');
    console.log('Response:', result.response.text());
  } catch (err) {
    console.log('❌ Gemini error:', err.message);
    if (err.message.includes('API_KEY')) console.log('   → Check API key validity');
    if (err.message.includes('quota')) console.log('   → You have hit the quota limit');
  }
}

test().catch(console.error);
EOF
```

**Test Groq:**
```bash
cd server
node << 'EOF'
async function test() {
  try {
    console.log('Testing Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Groq error:', data.error?.message || response.statusText);
      if (response.status === 401) console.log('   → Check API key validity');
      if (response.status === 429) console.log('   → You have hit the rate limit');
    } else {
      console.log('✅ Groq is working!');
      console.log('Response:', data.choices[0].message.content);
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
  }
}

test().catch(console.error);
EOF
```

### Step 4: Check MongoDB Connection

**Verify MongoDB URI:**
```bash
cd server
node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    console.log('Testing MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (err) {
    console.log('❌ MongoDB error:', err.message);
    console.log('Check your MONGODB_URI in .env');
  }
}

test();
EOF
```

### Step 5: Test Full Analysis Flow

**Create test-full-flow.js:**
```bash
cd server
cat > test-full-flow.js << 'EOF'
require('dotenv').config();
const { analyzeCode } = require('./utils/aiService');

const testCode = `
function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
`.trim();

async function test() {
  try {
    console.log('Testing full code analysis...');
    console.log('Code to analyze:');
    console.log(testCode);
    console.log('\n🔄 Analyzing...');
    
    const result = await analyzeCode(testCode, 'javascript');
    
    console.log('\n✅ Analysis successful!');
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

test();
EOF

node test-full-flow.js
```

### Step 6: Check Server Logs

**Watch server logs in real-time:**
```bash
cd server
npm run dev 2>&1 | grep -E "✅|❌|API|error|Error"
```

Look for:
```
✅ MongoDB connected      ← Good
🔄 Trying 3 AI provider(s)... ← Analysis started
✓ Attempting OpenAI...    ← Trying this provider
✅ OpenAI succeeded       ← Success!
```

---

## Common Issues & Solutions

### Issue 1: "OPENAI_API_KEY environment variable is not set"

**Cause:** Old code still installed
**Solution:**
```bash
cd server
npm update
```

### Issue 2: "Invalid format for X"

**Cause:** Key is incorrect format
**Solution:**
1. Regenerate key from provider's dashboard
2. Double-check copy-paste (no extra spaces)
3. Verify it matches the provider format

### Issue 3: Rate Limit Exceeded

**Groq rate limits:**
- Free: 100,000 tokens/day (~1000 analyses)
- Resets daily at UTC midnight

**Google Gemini rate limits:**
- Free: 60 requests/minute
- 1000+ per day (estimated)
- Resets hourly

**OpenAI rate limits:**
- Free trial: Very limited
- Paid: Usually no practical limits

**Solution:**
- Switch to different API
- Wait for limit reset
- Upgrade your plan

### Issue 4: Empty Response

**Cause:** AI returned empty or unparseable response
**Solution:**
1. Try again (might be temporary issue)
2. Use different API
3. Try shorter code sample

### Issue 5: Generic Responses

**Cause:** Using old version before fixes
**Solution:**
```bash
# Verify you have latest code
cd server
git status
# Should show no changes to aiService.js
```

---

## Performance Monitoring

### Check API Response Times

**Add timing to .env:**
```env
DEBUG=true
```

**Monitor in server logs:**
```
  ✓ Attempting OpenAI...
  ✅ OpenAI succeeded (2.5s)
```

### Expected Times
- Groq: 2-3 seconds (fastest)
- Gemini: 3-4 seconds
- OpenAI: 5-8 seconds (depends on load)

---

## Logs Interpretation Guide

### Server Startup
```
✅ MongoDB connected
🚀 CodeReviewerAI API — by Aniket Singh
   Port  : 5000
   Env   : development
```
✅ Everything good!

### Code Analysis Start
```
🔄 Trying 3 AI provider(s)...
  ✓ Attempting OpenAI...
```
API is trying to analyze code

### Successful Analysis
```
  ✅ OpenAI succeeded
```
Analysis complete, response being returned

### Failed Analysis
```
  ⚠️  OpenAI failed: rate limited
  ✓ Attempting Groq...
  ✅ Groq succeeded
```
First API failed, fallback succeeded (this is normal)

### All Services Failed
```
  ⚠️  OpenAI failed: invalid API key
  ⚠️  Groq failed: rate limited
  ⚠️  Gemini failed: API key not set
```
❌ All services failed - check API keys and quotas

---

## Export Logs for Support

If you need help, export logs:

```bash
# Server logs
cd server
npm run dev > server.log 2>&1 &
# Make a request, wait 5 seconds
kill %1
cat server.log | tail -50

# Or with debug info
DEBUG=* npm run dev > server-debug.log 2>&1
```

Share the relevant parts (without API keys!) for support.

---

## Reset to Defaults

If you want to start fresh:

```bash
cd server
# Backup current config
cp .env .env.backup

# Reset to template
cp .env.example .env

# Add your keys again
nano .env
```

---

## Additional Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **Groq Docs:** https://console.groq.com/docs
- **Gemini Docs:** https://ai.google.dev/docs
- **MongoDB:** https://docs.mongodb.com
- **Express:** https://expressjs.com/

---

## Getting Help

If you're stuck:

1. Run `npm run test:apis` - comprehensive diagnostics
2. Check server logs - usually shows exact issue
3. Try one API at a time - isolate the problem
4. Read SETUP_AND_TROUBLESHOOTING.md - full guide
5. Check this file - advanced debugging steps
