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

router.use(authRateLimiter);

router.post('/signup', signup);
router.post('/login',  login);
router.post('/google', googleAuth);   // ← Google OAuth endpoint
router.get('/me',  protect, getMe);

module.exports = router;
