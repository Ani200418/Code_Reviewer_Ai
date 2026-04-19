/**
 * Review Controller
 * Handles code review submissions, history, stats, and file uploads
 */

const path      = require('path');
const Review    = require('../models/Review');
const { analyzeCode } = require('../utils/aiService');
const { executeCode } = require('../utils/codeExecutor');
const { reviewCodeSchema } = require('../utils/validators');

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'other'];

// ─── Detect language from file extension ─────────────────────────────────────

const EXT_TO_LANG = {
  '.js':  'javascript',
  '.jsx': 'javascript',
  '.ts':  'typescript',
  '.tsx': 'typescript',
  '.py':  'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.cc':  'cpp',
  '.cxx': 'cpp',
  '.c':   'cpp',
  '.go':  'go',
  '.rs':  'rust',
};

const detectLanguage = (fileName) => {
  if (!fileName) return 'other';
  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_LANG[ext] || 'other';
};

// ─── POST /api/review-code ────────────────────────────────────────────────────

const reviewCode = async (req, res, next) => {
  try {
    const { error, value } = reviewCodeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { code, language, fileName, targetLanguage } = value;
    const start = Date.now();

    // Step 1: Try to validate/compile code first
    const validationResult = executeCode(code, language, '');
    
    // Step 2: If compilation/syntax error exists, return immediately (no analysis)
    if (!validationResult.success && validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Compilation Error',
        compilationError: validationResult.error,
      });
    }

    // Step 3: Code is valid, proceed to AI analysis
    const aiResponse = await analyzeCode(code, language, targetLanguage);

    // Step 4: Execute the code to get actual output
    const executionResult = executeCode(code, language, '');
    const processingTime = Date.now() - start;

    // Step 5: Save review with complete information
    const review = await Review.create({
      userId:       req.userId,
      code,
      language,
      fileName:     fileName || null,
      executionOutput: {
        output: executionResult.output || '',
        error: executionResult.error || null,
        success: executionResult.success || false,
      },
      aiResponse,
      score:        aiResponse.score.overall,
      processingTime,
    });

    // Step 6: Return complete analysis with output
    res.status(201).json({
      success: true,
      data: {
        reviewId:           review._id,
        language:           review.language,
        fileName:           review.fileName,
        compilationStatus:  'Success',
        currentOutput:      executionResult.output || '',
        aiResponse:         review.aiResponse,
        score:              review.score,
        processingTime:     review.processingTime,
        createdAt:          review.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/upload-code ────────────────────────────────────────────────────

const uploadCode = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const code     = req.file.buffer.toString('utf8');
    const fileName = req.file.originalname;
    const language = detectLanguage(fileName);

    if (!code.trim()) {
      return res.status(400).json({ success: false, message: 'Uploaded file is empty' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ success: false, message: 'File content exceeds 50,000 characters' });
    }

    const start = Date.now();

    // Step 1: Validate code first
    const validationResult = executeCode(code, language, '');
    
    // Step 2: If compilation error, return immediately (no analysis)
    if (!validationResult.success && validationResult.error) {
      return res.status(400).json({
        success: false,
        message: 'Compilation Error',
        compilationError: validationResult.error,
      });
    }

    // Step 3: Code is valid, proceed to AI analysis
    const aiResponse = await analyzeCode(code, language, req.body.targetLanguage);

    // Step 4: Execute the code to get actual output
    const executionResult = executeCode(code, language, '');
    const processingTime = Date.now() - start;

    // Step 5: Save review
    const review = await Review.create({
      userId:   req.userId,
      code,
      language,
      fileName,
      executionOutput: {
        output: executionResult.output || '',
        error: executionResult.error || null,
        success: executionResult.success || false,
      },
      aiResponse,
      score:    aiResponse.score.overall,
      processingTime,
    });

    // Step 6: Return complete analysis with output
    res.status(201).json({
      success: true,
      data: {
        reviewId:           review._id,
        language:           review.language,
        fileName:           review.fileName,
        compilationStatus:  'Success',
        currentOutput:      executionResult.output || '',
        aiResponse:         review.aiResponse,
        score:              review.score,
        processingTime:     review.processingTime,
        createdAt:          review.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews ─────────────────────────────────────────────────────────

const getReviews = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-code -__v'),
      Review.countDocuments({ userId: req.userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current:      page,
          total:        Math.ceil(total / limit),
          totalReviews: total,
          hasMore:      page * limit < total,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/stats ───────────────────────────────────────────────────

const getStats = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const [stats, recentReviews] = await Promise.all([
      Review.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id:            null,
            totalReviews:   { $sum: 1 },
            averageScore:   { $avg: '$score' },
            languageCounts: { $push: '$language' },
          },
        },
      ]),
      Review.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-code -__v'),
    ]);

    const aggregated      = stats[0] || {};
    const totalReviews    = aggregated.totalReviews || 0;
    const averageScore    = aggregated.averageScore  ? Math.round(aggregated.averageScore) : 0;
    const languageArr     = aggregated.languageCounts || [];

    // Count occurrences of each language
    const languageCounts = languageArr.reduce((acc, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const mostUsedLanguage = Object.keys(languageCounts).length
      ? Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageScore,
        mostUsedLanguage,
        languageCounts,
        recentReviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/:id ─────────────────────────────────────────────────────

const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.userId });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/review/:id/public ──────────────────────────────────────────────

const getPublicReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).select('-userId');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/reviews/:id ──────────────────────────────────────────────────

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  reviewCode,
  uploadCode,
  getReviews,
  getStats,
  getReviewById,
  getPublicReview,
  deleteReview,
};
