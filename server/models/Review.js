/**
 * Review Model
 * Stores code review requests and AI responses
 */

const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const bugSchema = new mongoose.Schema(
  {
    issue: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const optimizationSchema = new mongoose.Schema(
  {
    suggestion: { type: String, required: true },
    impact: { type: String, required: true },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expected_output: { type: String, required: true },
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    overall: { type: Number, min: 0, max: 100, default: 0 },
    readability: { type: Number, min: 0, max: 100, default: 0 },
    efficiency: { type: Number, min: 0, max: 100, default: 0 },
    best_practices: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const aiResponseSchema = new mongoose.Schema(
  {
    issues: [bugSchema],
    improvements: [optimizationSchema],
    optimized_code: { type: String, default: '' },
    explanation: { type: String, default: '' },
    edge_cases: [{ type: String }],
    test_cases: [testCaseSchema],
    score: scoreSchema,
    converted_code: { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main Review Schema ───────────────────────────────────────────────────────

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      maxlength: [50000, 'Code cannot exceed 50,000 characters'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: {
        values: ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust', 'other'],
        message: 'Language {VALUE} is not supported',
      },
      lowercase: true,
    },
    fileName: {
      type: String,
      default: null,
      trim: true,
    },
    title: {
      type: String,
      default: 'Code Review',
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    userInput: {
      type: String,
      default: '',
      maxlength: [10000, 'User input cannot exceed 10,000 characters'],
    },
    aiResponse: {
      type: aiResponseSchema,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    processingTime: {
      type: Number, // milliseconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, language: 1 });

// ─── Virtual: short code preview ─────────────────────────────────────────────
reviewSchema.virtual('codePreview').get(function () {
  return this.code.substring(0, 200) + (this.code.length > 200 ? '...' : '');
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
