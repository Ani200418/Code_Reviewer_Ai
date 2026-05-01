/**
 * Review Controller — upgraded with public sharing support
 * Built with ❤️ by Aniket Singh
 */

const fs      = require('fs');
const path    = require('path');
const Review  = require('../models/Review');
const { analyzeCode, convertCode } = require('../utils/aiService');
const { reviewCodeSchema } = require('../utils/validators');
const { generateCodeName } = require('../utils/codeNaming');

/* ── POST /api/review-code ──────────────────────────────────────── */
const reviewCode = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { error, value } = reviewCodeSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map(d => d.message) });

    const { code, language, fileName } = value;
    const aiResponse = await analyzeCode(code, language);
    const processingTime = Date.now() - startTime;
    
    // Generate meaningful title from code
    const title = generateCodeName(code, fileName);

    const review = await Review.create({
      userId: req.userId, code, language,
      fileName: fileName || null, title, aiResponse,
      score: aiResponse.score?.overall || 0, processingTime,
    });

    res.status(201).json({
      success: true,
      message: 'Code analysis complete',
      data: {
        reviewId: review._id, language: review.language,
        fileName: review.fileName, title: review.title, aiResponse, score: review.score,
        processingTime, createdAt: review.createdAt,
      },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/reviews ───────────────────────────────────────────── */
const getReviews = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.userId })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .select('language fileName title score createdAt processingTime aiResponse.score').lean(),
      Review.countDocuments({ userId: req.userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { current: page, total: Math.ceil(total/limit), totalReviews: total, hasMore: skip+reviews.length < total },
      },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/reviews/stats ─────────────────────────────────────── */
const getStats = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const stats = await Review.aggregate([
      { $match: { userId: mongoose.Types.ObjectId.createFromHexString(req.userId) } },
      { $group: { _id: null, totalReviews: { $sum: 1 }, averageScore: { $avg: '$score' }, languages: { $push: '$language' } } },
    ]);

    if (!stats.length) {
      return res.status(200).json({ success: true, data: { totalReviews: 0, averageScore: 0, mostUsedLanguage: null, languageCounts: {}, recentReviews: [] } });
    }

    const languageCounts = stats[0].languages.reduce((acc, lang) => { acc[lang] = (acc[lang]||0)+1; return acc; }, {});
    const mostUsedLanguage = Object.entries(languageCounts).sort(([,a],[,b]) => b-a)[0]?.[0];
    const recentReviews = await Review.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5).select('language fileName score createdAt').lean();

    res.status(200).json({
      success: true,
      data: {
        totalReviews: stats[0].totalReviews,
        averageScore: Math.round(stats[0].averageScore * 10) / 10,
        mostUsedLanguage, languageCounts, recentReviews,
      },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/reviews/:id ───────────────────────────────────────── */
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (err) { next(err); }
};

/* ── GET /api/review/:id/public  (no auth) ──────────────────────── */
const getPublicReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .select('code language fileName title aiResponse score createdAt')
      .lean();
    if (!review) return res.status(404).json({ success: false, message: 'Review not found or deleted.' });
    res.status(200).json({ success: true, data: review });
  } catch (err) { next(err); }
};

/* ── POST /api/upload-code ──────────────────────────────────────── */
const uploadCode = async (req, res, next) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { originalname, path: filePath, size } = req.file;
    if (size > 500*1024) { fs.unlinkSync(filePath); return res.status(413).json({ success: false, message: 'File too large. Max 500KB.' }); }

    const code = fs.readFileSync(filePath, 'utf-8');
    fs.unlinkSync(filePath);
    if (!code.trim()) return res.status(400).json({ success: false, message: 'Uploaded file is empty' });

    const ext = path.extname(originalname).toLowerCase().replace('.', '');
    const langMap = { js:'javascript', ts:'typescript', py:'python', java:'java', cpp:'cpp', cc:'cpp', go:'go', rs:'rust', cs:'csharp' };
    const language = langMap[ext] || 'other';

    const aiResponse = await analyzeCode(code, language);
    const processingTime = Date.now() - startTime;
    
    // Generate meaningful title from code
    const title = generateCodeName(code, originalname);

    const review = await Review.create({
      userId: req.userId, code, language, fileName: originalname, title,
      aiResponse, score: aiResponse.score?.overall || 0, processingTime,
    });

    res.status(201).json({
      success: true, message: 'File analyzed successfully',
      data: { reviewId: review._id, fileName: originalname, language, title, aiResponse, score: review.score, processingTime, createdAt: review.createdAt },
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

/* ── DELETE /api/reviews/:id ────────────────────────────────────── */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

/* ── POST /api/convert-code ────────────────────────────────────── */
const convertCodeText = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { code, language, targetLanguage } = req.body;
    
    if (!code || !code.trim()) return res.status(400).json({ success: false, message: 'Code is required' });
    if (!language) return res.status(400).json({ success: false, message: 'Language is required' });
    if (!targetLanguage) return res.status(400).json({ success: false, message: 'Target language is required' });

    const convertedCode = await convertCode(code, language, targetLanguage);
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Code conversion complete',
      data: {
        convertedCode,
        processingTime,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { reviewCode, getReviews, getReviewById, getStats, uploadCode, deleteReview, getPublicReview, convertCodeText };
