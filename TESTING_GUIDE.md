# 🧪 Quick Testing Guide

## Running the Project

### 1. Start Backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:5001
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Ensure Docker is Running
```bash
docker --version
# Should show Docker version

# Or start Docker:
# macOS: open /Applications/Docker.app
```

---

## Testing Code Execution

### Test 1: JavaScript Output
**Input Code:**
```javascript
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}
console.log(factorial(5));
```

**Expected:**
- Title: "Factorial Program" ✓
- Output: "120" ✓
- No "simulated" messages ✓

### Test 2: Python Output (Docker)
**Input Code:**
```python
def sum_of_squares(n):
    return sum(i**2 for i in range(1, n+1))
print(sum_of_squares(5))
```

**Expected:**
- Title: "Code Snippet" or filename ✓
- Output: "55" ✓
- Real Docker execution ✓

### Test 3: Java Output
**Input Code:**
```java
public class Main {
    public static void main(String[] args) {
        for(int i = 1; i <= 5; i++) {
            System.out.println("Number: " + i);
        }
    }
}
```

**Expected:**
- Title: "Loop Example" ✓
- Output: 5 lines printed ✓

### Test 4: C++ Output
**Input Code:**
```cpp
#include <iostream>
using namespace std;
int main() {
    for(int i = 1; i <= 3; i++) {
        cout << "i = " << i << endl;
    }
    return 0;
}
```

**Expected:**
- Title: "Nested Loop Algorithm" or "Loop Example" ✓
- Output: 3 lines ✓

---

## Testing AI Analysis

### Test 1: Multi-API Parallel
**Check logs:**
```bash
# Terminal running backend
# Should show:
[AI] Available APIs: OpenAI, Groq, Gemini
[AI] ✅ OpenAI succeeded  (or whichever is fastest)
[AI] Got response (XXXX chars)
```

### Test 2: Fallback When One API Fails
**Temporarily set wrong API key:**
```bash
# In .env
OPENAI_API_KEY=invalid_key
```

**Check logs:**
```
[AI] OpenAI failed, trying Groq...
[AI] ✅ Groq succeeded
```

### Test 3: API Timeout
**Check:**
- If one API is slow, another should return first ✓
- No waiting for timeouts ✓

---

## Testing Code Names

### Automatic Detection
Input these codes and verify titles:

**Factorial:**
```javascript
function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }
```
→ Title: "Factorial Program" ✓

**Sorting:**
```javascript
function bubbleSort(arr) {
  for(let i = 0; i < arr.length; i++) {
    for(let j = 0; j < arr.length-1; j++) {
      if(arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
    }
  }
  return arr;
}
```
→ Title: "Sorting Algorithm" ✓

**Recursion:**
```javascript
function fibonacci(n) {
  return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);
}
```
→ Title: "Recursive Function" ✓

**Class:**
```javascript
class User {
  constructor(name) { this.name = name; }
  getName() { return this.name; }
}
```
→ Title: "Object-Oriented Program" ✓

---

## Testing History

### 1. Submit Multiple Reviews
- JavaScript code → should show "Factorial Program"
- Python code → should show filename or generic
- Java code → should show "Loop Example"
- C++ code → should show appropriate title

### 2. Check Dashboard
- Recent reviews section shows titles ✓
- Not just filenames ✓
- All scores calculated correctly ✓

### 3. Check History Page
- All titles visible in list ✓
- Can click and view details ✓
- Title displayed with execution output ✓

---

## Testing Error Handling

### Test 1: Empty Code
```bash
Submit empty code → Error: "Code cannot be empty"
```

### Test 2: Syntax Error
```javascript
function broken(
  return 1;
}
```
→ Should show JavaScript syntax error ✓

### Test 3: Runtime Error
```python
result = 1 / 0  # Division by zero
print(result)
```
→ Should show Python runtime error ✓

### Test 4: Timeout
```python
while True:
    pass  # Infinite loop
```
→ Should timeout after 8 seconds with error ✓

---

## Checking Database

### MongoDB Check
```bash
# Connect to MongoDB
mongo

# Select database
use ai_code_reviewer

# Check reviews
db.reviews.findOne()

# Should show:
{
  "_id": ObjectId(...),
  "title": "Factorial Program",  ← NEW FIELD
  "code": "...",
  "language": "javascript",
  "executionOutput": {
    "output": "120",
    "error": null,
    "success": true
  },
  "aiResponse": { ... },
  ...
}
```

---

## Performance Checks

### Check 1: Speed
- First request: ~5-15 seconds (AI analysis time)
- Subsequent requests: ~5 seconds (cached patterns)
- Docker execution: < 2 seconds

### Check 2: Memory
- Docker limited to 256MB per execution
- No memory leaks
- Temp files cleaned up

### Check 3: CPU
- Docker limited to 0.5 cores
- Doesn't hog system resources

---

## Common Issues & Fixes

### Issue: "docker: not found"
**Fix:**
```bash
# Install Docker or start it
# Backend gracefully handles this with empty output
```

### Issue: "ENOENT: no such file"
**Fix:**
```bash
# Make sure /server/temp directory exists
mkdir -p server/temp
```

### Issue: API Key error
**Fix:**
```bash
# Check .env file has valid API key
cat .env | grep API_KEY

# Or set in terminal:
export OPENAI_API_KEY=your_key_here
```

### Issue: Timeout errors
**Fix:**
```bash
# Increase timeout if needed (default 8 seconds)
# Edit server/runners/codeRunner.js line: timeout: 8000
```

### Issue: Title not generating
**Fix:**
```bash
# Clear cache and refresh:
# Frontend: Hard refresh (Ctrl+Shift+R)
# Backend: npm restart
```

---

## Verification Checklist

Before deploying to production:

- [ ] JavaScript code executes and returns real output
- [ ] Python code executes (if Docker available)
- [ ] Java code compiles and runs
- [ ] C++ code compiles and runs
- [ ] Code names are meaningful (not generic)
- [ ] History saves with titles
- [ ] Dashboard shows titles
- [ ] AI analysis returns from multiple APIs
- [ ] Fallback works (test by disabling one API)
- [ ] Errors show real messages (not simulated)
- [ ] Timeout protection works
- [ ] No "simulated" messages anywhere
- [ ] TypeScript types compile without errors
- [ ] Git log shows the fix commit

---

## Success Indicators

✅ Project is working correctly when:

1. **Execution:**
   - Real output from Docker (not simulated)
   - No "Java execution simulated" messages
   - Actual code output displayed

2. **Naming:**
   - Factorial code → "Factorial Program"
   - Sorting code → "Sorting Algorithm"
   - Loop code → "Loop Example"

3. **AI Analysis:**
   - All 3 APIs called
   - Fastest response returned
   - Proper error handling

4. **History:**
   - Titles saved in MongoDB
   - Titles displayed on dashboard
   - Titles visible in history list

5. **Performance:**
   - < 15 seconds total time
   - Memory limited to 256MB
   - CPU limited to 0.5 cores

---

## Support & Debugging

### View Backend Logs
```bash
cd server
npm start
# Watch console for [Docker], [AI], error messages
```

### View Frontend Logs
```bash
# Open browser DevTools (F12)
# Console tab → check for errors
```

### Test API Directly
```bash
curl -X POST http://localhost:5001/api/review-code \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"test\")",
    "language": "javascript"
  }'
```

---

All systems ready. Enjoy! 🚀
