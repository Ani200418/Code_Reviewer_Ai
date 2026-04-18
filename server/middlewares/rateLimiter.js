/**
 * Rate Limiter Middleware
 * Different limits for global, auth, and AI endpoints
 */

const rateLimit = require('express-rate-limit');

const ALLOWED_ORIGIN = (process.env.CLIENT_URL || 'http://localhost:3000').trim();

/**
 * Extract the real client IP even when behind the Next.js proxy.
 * express-rate-limit uses req.ip by default; with `app.set('trust proxy', 1)`
 * that already reads X-Forwarded-For[0]. This helper is a belt-and-suspenders
 * fallback so each real user gets their own rate-limit bucket.
 */
function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Custom handler that keeps CORS headers on rate-limited responses.
 * express-rate-limit v7 replaces the response entirely when the limit is
 * exceeded — without this handler, the CORS headers set by our middleware
 * are lost and the browser shows a CORS error instead of the rate-limit message.
 */
function rateLimitHandler(req, res) {
  const requestOrigin = req.headers.origin;
  const allowOrigin =
    requestOrigin && requestOrigin.trim() === ALLOWED_ORIGIN
      ? requestOrigin
      : ALLOWED_ORIGIN;

  res.setHeader('Access-Control-Allow-Origin',      allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
}

/**
 * Global rate limiter — applied to all routes
 */
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: getClientKey,
  handler: rateLimitHandler,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
});

/**
 * Auth rate limiter — stricter for login/signup to prevent brute-force
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: getClientKey,
  handler: (req, res) => {
    const requestOrigin = req.headers.origin;
    const allowOrigin =
      requestOrigin && requestOrigin.trim() === ALLOWED_ORIGIN
        ? requestOrigin
        : ALLOWED_ORIGIN;

    res.setHeader('Access-Control-Allow-Origin',      allowOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    });
  },
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * AI rate limiter — controls OpenAI API usage cost
 */
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: (req, res) => {
    const requestOrigin = req.headers.origin;
    const allowOrigin =
      requestOrigin && requestOrigin.trim() === ALLOWED_ORIGIN
        ? requestOrigin
        : ALLOWED_ORIGIN;

    res.setHeader('Access-Control-Allow-Origin',      allowOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(429).json({
      success: false,
      message: 'AI review limit reached. You can perform 20 reviews per 15 minutes.',
    });
  },
  skip: (req) => req.method === 'OPTIONS',
});

module.exports = { globalRateLimiter, authRateLimiter, aiRateLimiter };
