/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

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
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

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

  // AI API errors
  if (err.status === 429 || message.includes('rate limit') || message.includes('rate limited')) {
    statusCode = 429;
    message = 'API service is currently busy. Please try again in a moment.';
  }

  if (err.status === 503 || message.includes('temporarily unavailable')) {
    statusCode = 503;
    message = message; // Keep the detailed fallback message
  }

  if (err.status === 401 || message.includes('invalid API key') || message.includes('API key')) {
    statusCode = 401;
    message = 'API configuration error. Please check your API keys.';
  }

  // Check if this is an AI service failure message
  if (message.includes('All AI services') || message.includes('no longer available')) {
    statusCode = 503;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
