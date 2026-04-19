/**
 * Review Routes
 * POST /api/review-code      — analyze code text
 * POST /api/upload-code      — analyze uploaded file
 * GET  /api/reviews          — paginated history
 * GET  /api/reviews/stats    — dashboard stats
 * GET  /api/reviews/:id      — single review (owner only)
 * GET  /api/review/:id/public — public review (no auth)
 * DELETE /api/reviews/:id    — delete a review
 */

const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { protect }       = require('../middlewares/authMiddleware');
const { aiRateLimiter } = require('../middlewares/rateLimiter');

const {
  runCode,
  reviewCode,
  uploadCode,
  getReviews,
  getStats,
  getReviewById,
  getPublicReview,
  deleteReview,
} = require('../controllers/reviewController');

// Multer: store file in memory (max 500 KB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 500 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['text/plain', 'application/octet-stream', 'text/x-python',
      'text/x-java-source', 'application/javascript', 'text/javascript',
      'application/typescript', 'text/typescript'];
    const allowedExt  = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp',
      '.cc', '.cxx', '.c', '.go', '.rs', '.txt'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) return cb(null, true);
    cb(new Error('File type not supported. Please upload a source code file.'));
  },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/review/:id/public', getPublicReview);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(protect);

router.post('/run',          aiRateLimiter, runCode);
router.post('/review-code',  aiRateLimiter, reviewCode);
router.post('/upload-code',  aiRateLimiter, upload.single('file'), uploadCode);

// Order matters: /reviews/stats must come before /reviews/:id
router.get('/reviews/stats', getStats);
router.get('/reviews',       getReviews);
router.get('/reviews/:id',   getReviewById);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
