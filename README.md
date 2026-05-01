# 🔍 AI Code Reviewer v2

A powerful web application that uses AI to analyze, review, and convert code. Get detailed insights about code quality, performance, security, and more.

![GitHub](https://img.shields.io/badge/GitHub-Ani200418%2FCode_Reviewer_Ai-blue)
![Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🎯 Core Features
- **Code Analysis** - AI-powered code review with detailed insights
- **Code Conversion** - Translate code between 8+ programming languages
- **Quality Scoring** - Get overall, readability, efficiency, and best practices scores
- **Issue Detection** - Identify bugs, performance issues, and security concerns
- **Improvement Suggestions** - Get actionable recommendations for better code
- **Test Case Generation** - Auto-generate test cases for your code
- **Complexity Analysis** - Understand time and space complexity
- **Public Sharing** - Share reviews with others via unique links

### 🔐 Security & Auth
- JWT-based authentication
- Google OAuth integration
- Protected routes and rate limiting
- Secure file uploads (max 500KB)

### 🤖 AI Providers
- **Groq** (Primary) - Fast inference with `llama-3.1-8b-instant`
- **Mistral** (Secondary) - `mistral-small` with smart fallback
- **Google Gemini** (Tertiary) - `gemini-2.0-flash` as backup
- Automatic fallback system ensures reliability

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Icons** - Rich icon library
- **Framer Motion** - Smooth animations
- **Monaco Editor** - Professional code editor

### Backend
- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Token-based authentication
- **Multer** - File upload handling
- **Rate Limiter** - API protection

### Deployment
- Frontend: Vercel-ready (Next.js)
- Backend: Node.js compatible
- Database: MongoDB Atlas

---

## 📋 Supported Languages

- JavaScript / TypeScript
- Python
- Java
- C++
- Go
- Rust
- C#
- And more...

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- API keys for AI providers:
  - Groq API key
  - Google Gemini API key
  - Mistral API key
  - Google OAuth credentials

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Ani200418/Code_Reviewer_Ai.git
cd Code_Reviewer_Ai
```

#### 2. Setup Environment Variables

**Backend (`server/.env`)**
```properties
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Groq API
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# Google Gemini
GOOGLE_API_KEY=your_google_api_key

# Mistral
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-small

# CORS
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=20

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Frontend (`client/.env.local`)**
```properties
NEXT_PUBLIC_API_URL=http://localhost:5001
```

#### 3. Install Dependencies

**Backend**
```bash
cd server
npm install
```

**Frontend**
```bash
cd client
npm install
```

#### 4. Start Development Servers

**Backend**
```bash
cd server
npm start
# Server runs on http://localhost:5001
```

**Frontend** (in another terminal)
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 📖 API Documentation

### Authentication
All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Analysis
- **POST** `/api/review-code` - Analyze code text
- **POST** `/api/upload-code` - Analyze uploaded file
- **POST** `/api/convert-code` - Convert code to another language

#### History
- **GET** `/api/reviews` - Get user's reviews (paginated)
- **GET** `/api/reviews/:id` - Get specific review
- **GET** `/api/reviews/stats` - Get dashboard statistics
- **DELETE** `/api/reviews/:id` - Delete a review

#### Public
- **GET** `/api/review/:id/public` - Get public review (no auth required)

---

## 🎨 Usage

### 1. Sign Up / Log In
- Create account with email or Google OAuth
- JWT token stored in HTTP-only cookies

### 2. Code Analysis
- Paste code or upload a file
- Select programming language
- Click "Analyze with AI"
- Get detailed analysis with:
  - Quality score breakdown
  - Issues found with severity levels
  - Improvement suggestions
  - Edge cases to consider
  - Auto-generated test cases
  - Time & space complexity analysis

### 3. Code Conversion
- Paste code or upload a file
- Select target language from dropdown
- Click "🔄 Convert" button
- Get converted code instantly
- No analysis overhead - pure translation

### 4. Share Results
- Click "Share" button on any analysis
- Get shareable public link
- Others can view results without login

### 5. View History
- Access dashboard to see all past reviews
- Filter by language
- View statistics and trends

---

## 🔄 How It Works

### Analysis Flow
1. User submits code via editor or file upload
2. Backend validates input and detects language
3. Code sent to AI provider (Groq → Mistral → Gemini with fallback)
4. AI generates detailed analysis in JSON format
5. Results parsed and stored in MongoDB
6. Frontend displays formatted analysis

### Conversion Flow
1. User selects target language and clicks "Convert"
2. Backend calls `/convert-code` endpoint
3. Code sent to AI provider for translation only
4. Returns converted code without analysis
5. Frontend displays converted code in editor
6. User can copy or download the result

### Multi-Provider Fallback
- Tries Groq first (fastest and most reliable)
- Falls back to Mistral if Groq fails
- Falls back to Gemini if both fail
- Detailed error messages if all providers fail

---

## 📊 Quality Scoring

Scores range from 0-100:

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 90-100 | Excellent | Production-ready code |
| 70-89 | Good | Minor improvements needed |
| 50-69 | Average | Significant room for improvement |
| 30-49 | Poor | Major issues present |
| 0-29 | Critical | Requires immediate attention |

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **File Validation** - Only accepts code files (max 500KB)
- **Input Sanitization** - XSS protection
- **CORS Protection** - Restricted origins
- **HTTP-Only Cookies** - Prevents token theft
- **Environment Variables** - Secrets never in code

---

## 🐛 Troubleshooting

### "All AI services unavailable"
- Check API keys in `.env`
- Verify quota limits on provider dashboards
- Try again after a few minutes

### "Authentication failed"
- Check JWT expiration
- Clear browser cookies and re-login
- Verify token in Authorization header

### "File upload failed"
- File size exceeds 500KB
- File type not supported
- Check server file upload permissions

### MongoDB connection error
- Verify MONGODB_URI is correct
- Check IP whitelist on MongoDB Atlas
- Ensure database user has correct permissions

---

## 📈 Performance

- **Frontend**: Optimized Next.js build with code splitting
- **Backend**: Express.js with compression and caching
- **Database**: MongoDB with indexed queries
- **AI**: Multi-provider with ~2-5s average response time
- **Scalability**: Rate limiting and connection pooling ready

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
vercel deploy
```

### Backend (Node.js hosting)
```bash
cd server
npm install
npm start
```

Set environment variables on your hosting platform.

---

## 📝 Example: Using the API

### Analyze Code
```bash
curl -X POST http://localhost:5001/api/review-code \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() { console.log(\"world\"); }",
    "language": "javascript"
  }'
```

### Convert Code
```bash
curl -X POST http://localhost:5001/api/convert-code \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() { console.log(\"world\"); }",
    "language": "javascript",
    "targetLanguage": "python"
  }'
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

---

## 👤 Author

**Aniket Singh**
- GitHub: [@Ani200418](https://github.com/Ani200418)
- Email: aniketsingh886909@gmail.com

---

## 🙏 Acknowledgments

- Groq for lightning-fast LLM inference
- Google Gemini for powerful AI capabilities
- Mistral for reliable code generation
- Next.js and Express.js communities
- All contributors and users

---

## 📞 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Contact the author directly
- Check the troubleshooting section

---

## 🔗 Links

- **GitHub Repository**: [Code_Reviewer_Ai](https://github.com/Ani200418/Code_Reviewer_Ai)
- **Live Demo**: (Coming soon)
- **Documentation**: See above
- **API Docs**: `/api` endpoints documented above

---

Made with ❤️ by Aniket Singh
