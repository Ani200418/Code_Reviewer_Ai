# ⚡ CodeReviewerAI — Premium AI Code Analysis

> **Built with ❤️ by [Aniket Singh](https://github.com/aniketsingh)**  
> AI-powered code review tool with a Stripe-grade UI — bug detection, optimization, quality scores, and shareable reports. Powered by GPT-4.

---

## ✨ Features (v2 — Premium Edition)

### Core Features
* **Multi-Model AI Support**: Uses OpenAI (GPT-4o) with intelligent failovers to Groq (Llama 3.3) and Google Gemini (Flash) for absolute reliability.
* **Code Translation**: Automatically detects and translates code if you specify a different target language.
* **AI-Powered Code Review**: Detect bugs and suggest optimizations.
* **Detailed Reviews**: Get scores on readability, efficiency, and best practices.

### Feature List
| Category | Features |
| :--- | :--- |
| 🐛 Bug Detection | GPT-4/Groq/Gemini finds logical bugs, security issues, edge cases |
| ⚡ Optimization Suggestions | Performance improvements with impact scores |
| 📖 Code Explanation | Plain-English summary of what your code does |
| 🧪 Test Case Generation | Auto-generate edge-case test cases |
| 🔄 Code Translation | Seamless code conversion into any target language |
| 📊 Quality Score (0–100) | 4-dimensional: Overall, Readability, Efficiency, Best Practices |
| 🔗 Shareable Public Links | `/review/:id` — read-only public pages |
| 📤 Share to X / LinkedIn | One-click social sharing |
| 📥 Download JSON Report | Export full AI analysis as JSON |
| 🎨 Monaco Editor | VS Code-like editor with auto language detection |
| 🌙 Glassmorphism Dark UI | Premium Stripe/Vercel-inspired design |
| ⌨️ Keyboard Shortcut | `Ctrl/⌘ + Enter` to analyze |
| 📁 File Upload | Drag & drop `.js .ts .py .java .cpp .go .rs` |
| 📊 Dashboard Analytics | Total reviews, avg score, language breakdown |
| 🔐 JWT Auth | Secure signup/login with bcrypt |
| ⚡ Rate Limiting | Per-user AI limits to control costs |

---

## 🧱 Tech Stack

**Frontend:** Next.js 14 (App Router) · Tailwind CSS · Monaco Editor · React Hot Toast · Axios · Framer Motion  
**Backend:** Node.js · Express · MongoDB + Mongoose · JWT · OpenAI SDK · Multer · Joi  
**AI:** GPT-4o via OpenAI API  
**Deployment:** Vercel (frontend) · Render (backend) · MongoDB Atlas

---

## 📂 Project Structure

```
ai-code-reviewer/
├── client/                          # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx               # Root layout + providers
│   │   ├── globals.css              # Premium design system
│   │   ├── page.tsx                 # Marketing landing page
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── review/[id]/page.tsx     # 🆕 Public shareable review
│   │   └── dashboard/
│   │       ├── layout.tsx           # Sidebar nav
│   │       ├── page.tsx             # Stats dashboard
│   │       ├── review/page.tsx      # AI code review editor
│   │       └── history/
│   │           ├── page.tsx         # Review history
│   │           └── [id]/page.tsx    # Review detail
│   └── components/
│       ├── CodeEditor.tsx           # 🆕 Monaco + auto-detect + themes
│       ├── ReviewCard.tsx           # 🆕 Premium results display
│       ├── ScoreCircle.tsx          # 🆕 Animated SVG score ring
│       ├── ShareModal.tsx           # 🆕 Copy link + social share
│       ├── Loader.tsx               # 🆕 Multi-variant loaders
│       ├── Footer.tsx               # 🆕 Aniket Singh branding
│       ├── FileUpload.tsx           # Drag & drop uploader
│       └── ...
│
└── server/                          # Express API
    ├── controllers/reviewController.js  # + getPublicReview
    ├── routes/reviewRoutes.js           # + GET /review/:id/public
    └── ...
```

---

## 🚀 Quick Start

```bash
# 1. Clone / unzip
cd ai-code-reviewer

# 2. Backend
cd server
npm install
cp .env.example .env
# → Fill in MONGODB_URI, OPENAI_API_KEY, JWT_SECRET
npm run dev

# 3. Frontend (new terminal)
cd client
npm install
cp .env.example .env.local
npm run dev

# 4. Open http://localhost:3000
```

### Required `.env` variables (server):
```env
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-code-reviewer
JWT_SECRET=your_very_long_random_secret
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
CLIENT_URL=http://localhost:3000
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register user |
| `POST` | `/api/auth/login` | ❌ | Login + JWT |
| `GET`  | `/api/auth/me` | ✅ | Current user |
| `POST` | `/api/review-code` | ✅ | AI code review |
| `POST` | `/api/upload-code` | ✅ | File upload review |
| `GET`  | `/api/reviews` | ✅ | Review history |
| `GET`  | `/api/reviews/stats` | ✅ | Dashboard stats |
| `GET`  | `/api/reviews/:id` | ✅ | Single review |
| `DELETE` | `/api/reviews/:id` | ✅ | Delete review |
| `GET`  | `/api/review/:id/public` | ❌ | **Public shareable review** |

---

## 🚀 Deployment

**Frontend → Vercel**
```bash
cd client && vercel --prod
# Add NEXT_PUBLIC_API_URL in Vercel environment settings
```

**Backend → Render**
- Root: `server/` · Build: `npm install` · Start: `npm start`
- Add all `.env` variables in Render dashboard

---

## 👨‍💻 Creator

**Aniket Singh**  
Full-Stack Developer  
[GitHub](https://github.com/aniketsingh) · [LinkedIn](https://linkedin.com/in/aniketsingh)

---

*© 2025 CodeReviewerAI — Built with ❤️ by Aniket Singh*

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Identity Services API**
4. Under **Credentials → OAuth 2.0 Client IDs**, create a Web Application client
5. Add `http://localhost:3000` to **Authorized JavaScript origins**
6. Copy the **Client ID** and set it in both env files:
   - `server/.env` → `GOOGLE_CLIENT_ID=<your-client-id>`
   - `client/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>`
7. Run `npm install` in the `server/` folder to install `google-auth-library`
# Code_Reviewer_Ai
