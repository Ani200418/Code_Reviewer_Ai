/**
 * Analyze Routes
 * POST /api/analyze - Execute code and get AI analysis
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { aiRateLimiter } = require('../middlewares/rateLimiter');
const runCode = require('../runners/codeRunner');
const { analyzeCode } = require('../utils/aiService');
const Joi = require('joi');

// Validation schema
const analyzeSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  language: Joi.string().required().valid('javascript', 'python', 'java', 'cpp', 'go', 'rust'),
});

/**
 * POST /api/analyze
 * Execute code with Docker sandbox + get AI analysis
 * 
 * Request:
 * {
 *   "code": "print('Hello')",
 *   "language": "python"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "output": "Hello\n",
 *   "analysis": { ...aiResponse... }
 * }
 */
router.post('/analyze', protect, aiRateLimiter, async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = analyzeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { code, language } = value;

    // Step 1: Execute code in Docker sandbox
    const execution = await runCode(code, language);

    // Step 2: If execution fails, return error
    if (!execution.success) {
      return res.status(400).json({
        success: false,
        message: 'Execution failed',
        error: execution.error,
      });
    }

    // Step 3: Execute succeeded, now get AI analysis
    const analysis = await analyzeCode(code, language);

    // Step 4: Return combined response
    res.status(200).json({
      success: true,
      output: execution.output,
      analysis,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
