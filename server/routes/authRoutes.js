/**
 * Auth Routes
 * POST /api/auth/signup
 * POST /api/auth/login
 * POST /api/auth/google
 * GET  /api/auth/me
 */

const express = require('express');
const router  = express.Router();
const { signup, login, getMe, googleAuth } = require('../controllers/authController');
const { protect }         = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');

// Ensure preflight requests are handled
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

router.use(authRateLimiter);

router.post('/signup', signup);
router.post('/login',  login);
router.post('/google', googleAuth);   // ← Google OAuth endpoint
router.get('/me',  protect, getMe);

module.exports = router;
