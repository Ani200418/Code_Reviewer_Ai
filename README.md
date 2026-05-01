# 🚀 AI Code Reviewer

An intelligent SaaS platform that leverages AI to provide comprehensive code reviews. Get instant feedback on code quality, best practices, performance optimizations, and security vulnerabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node->=18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- 🤖 **AI-Powered Code Analysis** - Uses Google Generative AI and OpenAI for intelligent code reviews
- 📝 **Multi-Language Support** - Review code in JavaScript, Python, Java, C++, TypeScript, and more
- 🔐 **Secure Authentication** - JWT-based auth with Google OAuth integration
- 📊 **Detailed Reports** - Get comprehensive analysis with scores and recommendations
- 💾 **Review History** - Save and access all your previous code reviews
- ⚡ **Real-time Editor** - Monaco Editor for comfortable code input and editing
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎯 **Performance Metrics** - Track code quality improvements over time
- 🔒 **Rate Limiting** - Protected API with built-in rate limiting

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Monaco Editor
- Framer Motion for animations

**Backend:**
- Express.js
- Node.js
- MongoDB
- JWT Authentication
- Google Auth Library
- Multer for file uploads

**AI Services:**
- Google Generative AI (Gemini)
- OpenAI GPT

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- MongoDB instance (local or cloud)
- Environment variables configured

### Clone Repository
```bash
git clone https://github.com/Ani200418/Code_Reviewer_Ai.git
cd ai-code-reviewer-v2
```

### Install Dependencies
```bash
npm run install:all
```

This will install dependencies for both client and server.

### Environment Setup

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/code-reviewer

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CORS
CORS_ORIGIN=http://localhost:3000
```

Create `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 Getting Started

### Development Mode

Start both client and server:
```bash
npm run dev
```

Or start them separately:

**Backend:**
```bash
npm run dev:server
# Server runs on http://localhost:5000
```

**Frontend:**
```bash
npm run dev:client
# Client runs on http://localhost:3000
```

### Production Build

```bash
npm run build:client
npm start:server
```

## 📁 Project Structure

```
ai-code-reviewer-v2/
├── client/                    # Next.js frontend
│   ├── app/                  # App directory with pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── login/            # Authentication
│   │   ├── signup/           # User registration
│   │   └── review/           # Code review pages
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utilities and services
│   │   ├── api.ts           # API client
│   │   ├── services.ts      # Business logic
│   │   └── context/         # React context
│   └── public/              # Static assets
│
├── server/                   # Express backend
│   ├── controllers/          # Route handlers
│   ├── middlewares/          # Custom middlewares
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── runners/             # Code execution
│   └── uploads/             # File uploads
│
└── package.json             # Root package configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Code Review
- `POST /api/review/analyze` - Analyze code
- `GET /api/review/history` - Get review history
- `GET /api/review/:id` - Get specific review
- `DELETE /api/review/:id` - Delete review
- `POST /api/review/:id/share` - Share review

## 🔐 Authentication

The platform uses JWT (JSON Web Tokens) for authentication:

1. User signs up or logs in
2. Server generates JWT token
3. Token is stored in HTTP-only cookies
4. All protected routes require valid token
5. Google OAuth available for quick login

## 🧪 Testing

Test the API endpoints:
```bash
npm run test:apis
```

This runs predefined API tests to verify backend functionality.

## 🤖 Code Analysis Features

### Supported Languages
- JavaScript/TypeScript
- Python
- Java
- C++
- C#
- Go
- Rust
- PHP
- Ruby
- And more...

### Review Aspects
- ✅ Code Quality
- ✅ Best Practices
- ✅ Performance Optimization
- ✅ Security Analysis
- ✅ Error Handling
- ✅ Code Documentation
- ✅ Naming Conventions
- ✅ Architecture Patterns

## 📊 Dashboard Features

- **Review History** - View all past code reviews
- **Statistics** - Track your code quality improvements
- **Saved Reviews** - Bookmark important reviews
- **Performance Metrics** - Visual charts and graphs
- **Export Reports** - Download review results as PDF

## 🔒 Security Features

- JWT Authentication
- Password hashing with bcryptjs
- Rate limiting (15 requests per 15 minutes per IP)
- CORS protection
- Helmet.js for HTTP headers security
- Input validation with Joi
- MongoDB injection prevention
- XSS protection

## 🚨 Error Handling

The API implements comprehensive error handling:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)
- Rate limit errors (429)

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `GOOGLE_API_KEY` | Google Generative AI key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No |
| `CORS_ORIGIN` | Frontend URL for CORS | Yes |

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access in MongoDB Atlas

### API Rate Limiting
- Wait 15 minutes before making new requests
- Or adjust `RATE_LIMIT_WINDOW` in server configuration

### File Upload Issues
- Check disk space
- Verify upload directory permissions
- Check max file size limits

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Aniket Singh**
- GitHub: [@Ani200418](https://github.com/Ani200418)
- Repository: [Code_Reviewer_Ai](https://github.com/Ani200418/Code_Reviewer_Ai)

## 🙏 Acknowledgments

- Google Generative AI for powerful code analysis
- OpenAI for supplementary AI capabilities
- Next.js team for excellent frontend framework
- Express.js community for robust backend framework
- MongoDB for flexible database solution

## 📞 Support

For issues, questions, or suggestions:
1. Open an issue on GitHub
2. Check existing issues for solutions
3. Provide detailed error messages and reproduction steps

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Core code review functionality
- User authentication
- Review history
- Multi-language support

---

**Last Updated:** May 1, 2026

**Live Demo:** Coming Soon!

**Status:** Active Development ✨
