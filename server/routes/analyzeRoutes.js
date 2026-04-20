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
    console.log(`[API] /analyze request: language=${language}, codeLength=${code.length}`);

    // Step 1: Execute code in Docker sandbox
    console.log(`[Docker] Starting execution for ${language}`);
    const execution = await runCode(code, language);
    console.log(`[Docker] Execution result: success=${execution.success}, outputLength=${execution.output?.length || 0}`);

    // Step 2: If execution fails, return error
    if (!execution.success) {
      console.log(`[Docker] Execution error: ${execution.error}`);
      return res.status(400).json({
        success: false,
        message: 'Code execution failed',
        error: execution.error,
        language,
      });
    }

    // Step 3: Execute succeeded, now get AI analysis
    console.log(`[AI] Starting analysis for ${language}`);
    const analysis = await analyzeCode(code, language);
    console.log(`[AI] Analysis complete: score=${analysis.score.overall}`);

    // Step 4: Return combined response
    res.status(200).json({
      success: true,
      output: execution.output,
      analysis,
    });
  } catch (err) {
    console.error('[API] Error in /analyze:', err.message);
    next(err);
  }
});

module.exports = router;
