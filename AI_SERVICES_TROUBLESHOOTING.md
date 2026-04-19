# 🔧 AI Services Troubleshooting Guide

## ❌ Error: "All AI services failed. Please try again later."

This error occurs when all configured AI API services are unable to process your request. Here's how to fix it:

---

## 🔍 Root Causes & Solutions

### 1. **Invalid or Missing API Keys** ⚠️

**Problem:** API keys in `.env` are incorrect or expired

**Solution:**
```bash
# Verify API keys are set
grep -E "OPENAI_API_KEY|GROQ_API_KEY|GEMINI_API_KEY" server/.env

# Check API key format (they should start with specific prefixes):
# - OpenAI: sk-proj-...
# - Groq: gsk_...
# - Gemini: AIza...
```

**To fix:**
1. Get new API keys from:
   - OpenAI: https://platform.openai.com/api-keys
   - Groq: https://console.groq.com/keys
   - Gemini: https://makersuite.google.com/app/apikey

2. Update `server/.env`:
```
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
GROQ_API_KEY=gsk_YOUR_NEW_KEY_HERE
GEMINI_API_KEY=AIza_YOUR_NEW_KEY_HERE
```

3. Restart backend: `npm start`

---

### 2. **API Rate Limiting** 🚫

**Problem:** Too many requests hitting API quota limits

**Symptoms:**
- Works for first few requests then fails
- Error occurs after sustained usage

**Solution:**
```bash
# Check server logs for rate limit errors
npm start  # Watch for 429 (Too Many Requests) or 403 (Forbidden) errors

# Reduce traffic:
# Option A: Increase request delays in frontend
# Option B: Use multiple API keys (round-robin)
# Option C: Implement caching
```

---

### 3. **Network Connectivity Issues** 🌐

**Problem:** Backend cannot reach AI services due to network/firewall

**Test connectivity:**
```bash
# Test OpenAI
curl -H "Authorization: Bearer sk-proj-YOUR_KEY" \
  https://api.openai.com/v1/models

# Test Groq
curl -H "Authorization: Bearer gsk_YOUR_KEY" \
  https://api.groq.com/v1/models

# Test Gemini
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
```

**Solutions:**
- Check firewall/proxy settings
- Verify port 443 (HTTPS) is open
- Try from different network
- Contact IT if behind corporate firewall

---

### 4. **API Service Outage** 📴

**Problem:** The AI service itself is down

**Check status:**
```bash
# OpenAI Status: https://status.openai.com
# Groq Status: https://status.groq.com
# Google Gemini: https://cloud.google.com/status
```

**What to do:**
- Wait for service to come back online
- Switch to alternative AI service
- Implement graceful degradation

---

### 5. **Malformed Request** ❌

**Problem:** Request format doesn't match API specifications

**Verify request format:**
```bash
# Test with curl
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "print(\"Hello\")",
    "language": "python"
  }'
```

**Check for:**
- Invalid code (too large > 50,000 chars)
- Invalid language (not in: javascript, python, java, cpp, go, rust)
- Missing required fields
- Incorrect JSON format

---

### 6. **API Timeout** ⏱️

**Problem:** Request takes too long and times out

**Solutions:**
```bash
# Increase timeout in aiService.js (search for timeout config)
# Optimize code analysis (use simpler prompts)
# Reduce code complexity in test
```

---

## 🛠️ Enhanced Error Recovery (Now Implemented)

The updated `aiService.js` now includes:

✅ **Retry Logic**
- Automatically retries failed API calls
- Exponential backoff (1s, 2s, 4s delays)
- Up to 2-3 retry attempts

✅ **Fallback Mechanism**
- Tries APIs in parallel (fast)
- Falls back to sequential (reliable)
- Multiple API support for redundancy

✅ **Better Error Messages**
- Logs which API failed and why
- Provides detailed error information
- Helps identify root cause

---

## 📋 Debugging Checklist

Run through these steps:

```bash
# 1. Verify API keys exist
cat server/.env | grep API_KEY

# 2. Check server is running
npm start  # Should show "API running on port 5001"

# 3. Verify MongoDB connection
# Should see "✅ MongoDB connected" in logs

# 4. Test endpoint directly
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"code":"print(1)","language":"python"}'

# 5. Check network connectivity
curl -I https://api.openai.com

# 6. Review server logs for specific errors
# Look for: "OpenAI API failed:", "Groq API failed:", etc.
```

---

## 🔄 Troubleshooting Flow

```
Error "All AI services failed"
        ↓
[Check API Keys]
    ├─ Missing? → Get new keys, update .env, restart
    ├─ Invalid? → Regenerate keys, update .env, restart
    └─ Valid? → Continue
        ↓
[Check Network]
    ├─ Can't reach API? → Check firewall/proxy
    ├─ Rate limited? → Wait, reduce load, or upgrade plan
    └─ Connected? → Continue
        ↓
[Check Service Status]
    ├─ API down? → Wait for recovery
    └─ API up? → Continue
        ↓
[Check Request Format]
    ├─ Code too large? → Reduce code size
    ├─ Invalid language? → Use supported language
    └─ Format valid? → Continue
        ↓
[Check Logs]
    ├─ Review server console output
    ├─ Look for specific API errors
    └─ Compare with this guide
        ↓
[If Still Failing]
    → Try single API (comment out others)
    → Test with simple code first
    → Check API documentation
    → Contact API support
```

---

## 🧪 Quick Test Script

```bash
#!/bin/bash
# Test AI services

echo "Testing OpenAI..."
curl -s -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"code":"print(1)","language":"python"}' | jq .

echo ""
echo "Testing error handling..."
curl -s -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"code":"","language":"invalid"}' | jq .
```

---

## 📞 Support Resources

### OpenAI Support
- **Docs:** https://platform.openai.com/docs
- **Status:** https://status.openai.com
- **API Key Setup:** https://platform.openai.com/account/api-keys

### Groq Support
- **Docs:** https://console.groq.com/docs
- **Status:** https://status.groq.com
- **API Key Setup:** https://console.groq.com/keys

### Google Gemini Support
- **Docs:** https://ai.google.dev/
- **Status:** https://cloud.google.com/status
- **API Key Setup:** https://makersuite.google.com/app/apikey

---

## ✅ Verification

Once fixed, verify with:

```bash
# Backend should be running
curl http://localhost:5001/health

# API should respond with analysis
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code":"console.log(1)","language":"javascript"}'

# Should return:
# { "success": true, "output": "1\n", "analysis": { ... } }
```

---

## 🚀 Next Steps

1. **Identify the exact error** in server logs
2. **Use the checklist above** to isolate the issue
3. **Apply the relevant solution**
4. **Restart backend:** `npm start`
5. **Test with simple code** first
6. **Verify it works** before retesting

---

**Need more help?** Check the comprehensive docs:
- Backend implementation: `BACKEND_UPDATE.md`
- Integration guide: `INTEGRATION_GUIDE.md`
- Quick reference: `QUICK_REFERENCE.md`
