/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

/**
 * Ensure CORS headers are present on every response, including errors.
 * The main CORS middleware sets headers before routes run, but Express
 * error handlers are a separate chain — we re-apply them here so that
 * error responses (4xx/5xx) are never blocked by the browser.
 */
function ensureCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowOrigin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin.trim())
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

  if (!res.getHeader('Access-Control-Allow-Origin')) {
    res.setHeader('Access-Control-Allow-Origin',      allowOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

/**
 * 404 — Route not found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler
 * Catches all errors thrown in controllers and middleware
 */
const errorHandler = (err, req, res, next) => {
  // Always re-apply CORS headers so browser doesn't block error responses
  ensureCorsHeaders(req, res);

  // Use err.statusCode only. Deliberately ignore err.status — it can be set
  // by external libraries (e.g. GaxiosError from google-auth-library, Axios,
  // OpenAI SDK) with the HTTP status of a THIRD-PARTY server. Propagating it
  // would forward, e.g., Google's 403 → your client as if YOUR endpoint failed.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Clamp to valid server-error range — never accidentally send 1xx/3xx
  if (statusCode < 400 || statusCode > 599) statusCode = 500;

  // Log error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.error(`   Status: ${statusCode}`);
    console.error(`   Error:  ${message}`);
    if (err.stack) console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(statusCode).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File is too large. Maximum allowed size is 500KB.';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field in upload request.';
  }

  // AI API errors (check both err.status and err.statusCode)
  if (err.status === 429 || err.statusCode === 429) {
    statusCode = 429;
    message = 'AI service rate limit exceeded. Please try again in a moment.';
  }

  if (err.status === 503 || err.statusCode === 503) {
    statusCode = 503;
    message = err.message || 'AI services temporarily unavailable. Please check API keys and quotas.';
  }

  // Handle detailed error responses in development/staging
  const isDetailedErrorEnv = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDetailedErrorEnv && { 
      details: err.message,
      timestamp: new Date().toISOString(),
    }),
    ...(isDetailedErrorEnv && err.stack && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
