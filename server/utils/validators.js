/**
 * Input Validators using Joi
 * Centralized validation schemas for all API endpoints
 */

const Joi = require('joi');

// ─── Auth Validators ──────────────────────────────────────────────────────────

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// ─── Review Validators ────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'go',
  'rust',
  'other',
];

const reviewCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50000).required().messages({
    'string.min': 'Code cannot be empty',
    'string.max': 'Code cannot exceed 50,000 characters',
    'any.required': 'Code is required',
  }),
  language: Joi.string()
    .trim()
    .lowercase()
    .valid(...SUPPORTED_LANGUAGES)
    .required()
    .messages({
      'any.only': `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
      'any.required': 'Language is required',
    }),
  fileName: Joi.string().trim().max(255).optional().allow('', null),
  targetLanguage: Joi.string().trim().lowercase().valid(...SUPPORTED_LANGUAGES).optional().allow('', null),
});

module.exports = { signupSchema, loginSchema, reviewCodeSchema };
