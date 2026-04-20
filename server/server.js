/**
 * AI Code Reviewer — Express Server
 * Built with ❤️ by Aniket Singh
 */
require('dotenv').config();
const express  = require('express');
const helmet   = require('helmet');
const morgan   = require('morgan');
const mongoose = require('mongoose');
const path     = require('path');

const authRoutes   = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { globalRateLimiter }      = require('./middlewares/rateLimiter');

const app = express();

// Trust the first proxy hop (Next.js dev server / nginx in production).
// Without this, req.ip is always 127.0.0.1 for every user when behind a proxy,
// which means ALL users share one rate-limit bucket and exhaust it instantly.
app.set('trust proxy', 1);

/* ================= CORS — must be the very first middleware ================= */
// Raw middleware instead of the cors npm package.
// The cors package does a fragile exact-string match on the Origin header and
// silently sets NO headers when the match fails — producing the misleading
// "No Access-Control-Allow-Origin" error with no indication of why.
// A raw middleware is explicit, predictable, and always correct.

const ALLOWED_ORIGIN = (process.env.CLIENT_URL || 'http://localhost:3000').trim();

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  // Echo back the request origin if it matches; otherwise use the configured URL.
  const allowOrigin =
    requestOrigin && requestOrigin.trim() === ALLOWED_ORIGIN
      ? requestOrigin
      : ALLOWED_ORIGIN;

  res.setHeader('Access-Control-Allow-Origin',      allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods',     'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age',           '86400');

  // Respond immediately to every OPTIONS preflight.
  // Nothing downstream (rate limiter, auth, routes) should ever see OPTIONS.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

/* ================= SECURITY HEADERS ================= */
// crossOriginOpenerPolicy:   false — Helmet default "same-origin" blocks
//   window.postMessage from Google OAuth popup → Google Sign-In breaks.
// crossOriginEmbedderPolicy: false — default "require-corp" blocks
//   cross-origin resources that Google Sign-In depends on.
// contentSecurityPolicy:     false — default CSP blocks accounts.google.com.
app.use(helmet({
  crossOriginResourcePolicy:  false,
  crossOriginOpenerPolicy:    false,
  crossOriginEmbedderPolicy:  false,
  contentSecurityPolicy:      false,
}));

/* ================= PARSING ================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ================= LOGGING ================= */
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
else app.use(morgan('combined'));

/* ================= RATE LIMIT ================= */
app.use(globalRateLimiter);

/* ================= DEBUG ================= */
// Remove logging in production
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

/* ================= STATIC ================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================= HEALTH ================= */
app.get('/health', (req, res) =>
  res.json({
    status:  'ok',
    service: 'AI Code Reviewer API',
    ts:      new Date().toISOString(),
  })
);

/* ================= ROOT ================= */
app.get('/', (req, res) =>
  res.json({
    message: 'AI Code Reviewer API',
    version: '2.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      review: '/api/review-code',
      analyze: '/api/analyze',
    },
  })
);

/* ================= ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', reviewRoutes);

/* ================= ERROR HANDLING ================= */
app.use(notFound);
app.use(errorHandler);

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`\n🚀 CodeReviewerAI API — by Aniket Singh`);
      console.log(`   Port  : ${PORT}`);
      console.log(`   Env   : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
