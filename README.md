# AI Code Reviewer

A powerful AI-driven code review and code conversion tool that analyzes your code for quality, performance, and best practices, or converts code between different programming languages.

## Features

- **Code Analysis**: Get comprehensive code reviews with quality scores and detailed feedback
- **Code Conversion**: Convert code between multiple programming languages
- **Multi-Language Support**: Supports Java, Python, JavaScript, TypeScript, C++, Go, Rust, and more
- **Quality Scoring**: Automatic scoring based on readability, performance, security, and best practices
- **Code Sharing**: Share your reviews with others via unique links
- **User Authentication**: Secure login/signup with JWT
- **Review History**: Keep track of all your code reviews

## Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Monaco Editor

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication

**AI Providers:**
- Groq (Primary)
- Mistral (Secondary)
- Google Gemini (Fallback)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- API keys for at least one AI provider

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ani200418/Code_Reviewer_Ai.git
   cd ai-code-reviewer-v2
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Variables**

   Create `.env` in the `server` folder:
   ```properties
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # Groq API
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   
   # Google Gemini API
   GOOGLE_API_KEY=your_google_api_key
   
   # Mistral API
   MISTRAL_API_KEY=your_mistral_api_key
   MISTRAL_MODEL=mistral-small
   
   # Frontend
   CLIENT_URL=http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AI_RATE_LIMIT_MAX=20
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

## Running the Application

1. **Start Backend**
   ```bash
   cd server
   npm start
   ```
   Server runs on `http://localhost:5001`

2. **Start Frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```
   Application runs on `http://localhost:3000`

## Usage

### Code Analysis
1. Navigate to the Review page
2. Paste your code or upload a file
3. Select the programming language
4. Click "Analyze Code"
5. View detailed analysis with quality score and recommendations

### Code Conversion
1. Navigate to the Review page
2. Paste your code or upload a file
3. Select source and target languages
4. Click "Convert Code"
5. Get your converted code instantly

## API Endpoints

### Public Routes
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Protected Routes (Requires Authentication)
- `POST /api/review-code` - Analyze code text
- `POST /api/upload-code` - Analyze uploaded code file
- `POST /api/convert-code` - Convert code to another language
- `GET /api/reviews` - Get review history
- `GET /api/reviews/stats` - Get dashboard statistics
- `DELETE /api/reviews/:id` - Delete a review

## Deployment

### Deploy Frontend (Vercel)
```bash
cd client
npm run build
vercel deploy
```

### Deploy Backend (Railway/Render)
```bash
cd server
git push heroku main
```

## Getting API Keys

### Groq
1. Visit https://console.groq.com/
2. Sign up and create an API key
3. Add to `.env`

### Google Gemini
1. Visit https://makersuite.google.com/
2. Create a new API key
3. Add to `.env`

### Mistral
1. Visit https://console.mistral.ai/
2. Create an API key
3. Add to `.env`

## Troubleshooting

**Port already in use?**
```bash
lsof -i :5001  # Find process
kill -9 <PID>  # Kill process
```

**MongoDB connection failed?**
- Check connection string in `.env`
- Ensure IP is whitelisted in MongoDB Atlas

**AI API errors?**
- Verify API keys are correct
- Check rate limits haven't been exceeded
- Ensure at least one AI provider is configured

## License

MIT License - feel free to use this project

## Support

For issues and questions, open an issue on GitHub.
