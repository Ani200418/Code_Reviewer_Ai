/**
 * AI Code Reviewer — Express Server
 * Built with ❤️ by Aniket Singh
 */
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const mongoose = require('mongoose');
const path     = require('path');

const authRoutes   = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { globalRateLimiter }      = require('./middlewares/rateLimiter');

const app = express();

/* ================= SECURITY (FIXED CORS) ================= */

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

// 🔥 MUST BE FIRST - Apply CORS before helmet
app.use(cors(corsOptions));

// 🔥 IMPORTANT: handle preflight explicitly
app.options('*', cors(corsOptions));

// 🔥 HARD FIX for stubborn CORS + Google OAuth
app.use((req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', clientUrl);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

/* ================= SECURITY HEADERS ================= */
app.use(helmet({
  crossOriginResourcePolicy: false,
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
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* ================= STATIC ================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================= HEALTH ================= */
app.get('/health', (req, res) => 
  res.json({ 
    status:'ok', 
    service:'AI Code Reviewer API', 
    ts: new Date().toISOString() 
  })
);

/* ================= ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api',      reviewRoutes);

/* ================= ERROR HANDLING ================= */
app.use(notFound);
app.use(errorHandler);

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

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