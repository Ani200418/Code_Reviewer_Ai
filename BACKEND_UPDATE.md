# 🎯 Backend Update - Code Execution & AI Analysis Integration

## ✅ Changes Implemented

### 1. **New Route: `/api/analyze` (POST)**

**Location:** `/server/routes/analyzeRoutes.js`

**Purpose:** Execute code in a Docker sandbox and get AI analysis in a single request.

**Request Format:**
```json
{
  "code": "print('Hello Python')",
  "language": "python"
}
```

**Response Format (Success):**
```json
{
  "success": true,
  "output": "Hello Python\n",
  "analysis": {
    "issues": [...],
    "improvements": [...],
    "optimized_code": "...",
    "score": { "overall": 85, ... }
  }
}
```

**Response Format (Execution Error):**
```json
{
  "success": false,
  "message": "Execution failed",
  "error": "NameError: name 'pritn' is not defined"
}
```

---

### 2. **Enhanced Code Runner: `/server/runners/codeRunner.js`**

**Key Improvements:**

✅ **Memory & CPU Limits**
```javascript
--memory=200m      // Max 200MB RAM
--cpus=0.5         // Max 0.5 CPU cores
```

✅ **Timeout Protection**
```javascript
timeout: 8000      // 8 seconds max execution time
```

✅ **Security Features**
```javascript
--read-only        // Read-only filesystem
--network=none     // No network access
--rm               // Auto-cleanup after execution
```

✅ **Better Error Handling**
- Compilation errors → detailed error messages
- Timeout → "Execution timeout: Code took longer than 8 seconds"
- Validation errors → clear error descriptions

✅ **File Cleanup**
- Automatic deletion of temp files after execution
- Graceful cleanup even on errors

✅ **Language Support**

| Language | Image | Compiler/Runtime |
|----------|-------|------------------|
| **JavaScript** | node:18-alpine | Node.js 18 |
| **Python** | python:3.11-alpine | Python 3.11 |
| **Java** | openjdk:17-slim | OpenJDK 17 |
| **C++** | gcc:latest | GCC compiler |
| **Go** | golang:1.22-alpine | Go 1.22 |
| **Rust** | rust:latest | Rust toolchain |

---

### 3. **Backend Integration**

**Files Updated:**

1. ✅ `/server/server.js` - Mounted new analyzeRoutes
2. ✅ `/server/runners/codeRunner.js` - Enhanced with safety limits
3. ✅ Created `/server/routes/analyzeRoutes.js` - New endpoint

**Flow:**
```
Request → Validate Input → Execute in Docker → 
  ✓ Success → AI Analysis → Return Output + Analysis
  ✗ Error → Return Error
```

---

## 🌐 Frontend Integration

### 1. **API Service Layer**

**File:** `/client/lib/services.ts`

**New Interface:**
```typescript
export interface AnalyzeResult {
  output: string;
  analysis: AIResponse;
}

export const analyzeService = {
  analyze: async (code: string, language: string): Promise<AnalyzeResult> => {
    const res = await api.post('/analyze', { code, language });
    return res.data;
  },
};
```

### 2. **CodeEditor Component**

**File:** `/client/components/CodeEditor.tsx`

**Features:**
✅ Language tabs (JavaScript, TypeScript, Python, Java, C++, Go, Rust)
✅ Auto-detect language from code patterns
✅ Theme selector (VS Dark, Dracula, Night Owl)
✅ Copy/Clear buttons
✅ Line count & character count display
✅ Keyboard shortcut: `Cmd/Ctrl + Enter` to submit

---

## 🧪 Testing

### Test All Languages

```bash
# Set your JWT token
export JWT_TOKEN="your_token_here"

# Run tests
bash test_languages.sh
```

### Manual Testing with Curl

**JavaScript:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "console.log(\"Hello JS\")",
    "language": "javascript"
  }'
```

**Python:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "print(\"Hello Python\")",
    "language": "python"
  }'
```

**Java:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello Java\"); } }",
    "language": "java"
  }'
```

**C++:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "#include <iostream>\nusing namespace std;\nint main() { cout << \"Hello C++\"; }",
    "language": "cpp"
  }'
```

**Go:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "package main\nimport \"fmt\"\nfunc main() { fmt.Println(\"Hello Go\") }",
    "language": "go"
  }'
```

**Rust:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "fn main() { println!(\"Hello Rust\"); }",
    "language": "rust"
  }'
```

---

## 🔒 Security Features

### Memory Protection
- Limited to 200MB per execution
- Prevents memory exhaustion attacks

### CPU Protection
- Limited to 0.5 CPU cores
- Prevents CPU-intensive DoS attacks

### Timeout Protection
- 8-second maximum execution time
- Prevents infinite loops

### Network Isolation
- No network access (`--network=none`)
- Prevents external communication

### Filesystem Isolation
- Read-only filesystem (`--read-only`)
- Prevents file manipulation

### Container Cleanup
- Auto-removed after execution (`--rm`)
- No lingering resources

---

## 📋 Error Handling

### Execution Errors
```json
{
  "success": false,
  "message": "Execution failed",
  "error": "SyntaxError: Unexpected token"
}
```

### Timeout Errors
```json
{
  "success": false,
  "message": "Execution failed",
  "error": "Execution timeout: Code took longer than 8 seconds to run"
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["\"code\" is required"]
}
```

---

## 🚀 Production Deployment

### Environment Setup

**Required Docker images:**
```bash
docker pull node:18-alpine
docker pull python:3.11-alpine
docker pull openjdk:17-slim
docker pull gcc:latest
docker pull golang:1.22-alpine
docker pull rust:latest
```

### Configuration

**`.env` file:**
```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...
GEMINI_API_KEY=AIza...
```

### Monitoring

Monitor Docker resource usage:
```bash
docker stats
```

Monitor API logs:
```bash
npm run dev  # or with PM2: pm2 logs
```

---

## ✅ Verification Checklist

- [x] `/api/analyze` endpoint created
- [x] Code execution in Docker with memory/CPU limits
- [x] 8-second timeout implemented
- [x] All 6 languages supported (JS, Python, Java, C++, Go, Rust)
- [x] Error handling for compilation/runtime errors
- [x] Error handling for timeout
- [x] File cleanup after execution
- [x] Frontend API service updated
- [x] CodeEditor component has language selector
- [x] Auto-detect language feature working
- [x] Rate limiting applied to endpoint
- [x] JWT authentication required
- [x] Test script provided

---

## 🎯 Next Steps

1. **Start the server:**
   ```bash
   cd server && npm start
   ```

2. **Start the frontend:**
   ```bash
   cd client && npm run dev
   ```

3. **Test the `/api/analyze` endpoint** with all 6 languages

4. **Monitor Docker** for resource usage

5. **Deploy to production** with proper environment variables

---

## 📞 Support

If you encounter any issues:

1. Check Docker is running: `docker ps`
2. Verify images are available: `docker images`
3. Check logs: `docker logs <container_id>`
4. Test endpoint with curl first
5. Verify JWT token is valid

For detailed error information, check the server console output.
