/**
 * API Service Layer
 * All API calls centralized with typed responses
 */

import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Issue {
  issue: string;            // The issue description (stored field)
  explanation: string;      // Additional explanation
  severity: 'high' | 'medium' | 'low';
  type: 'bug' | 'performance' | 'security' | 'style';
  suggestion: string;       // Concrete fix suggestion
  // Legacy compatibility
  description?: string;
  line?: string;
}

export interface Improvement {
  suggestion: string;
  impact: string;
}

export interface TestCase {
  description: string;
  input: string;
  expected_output: string;
  category: 'normal' | 'edge' | 'corner';
}

export interface Score {
  overall: number;
  readability: number;
  efficiency: number;
  best_practices: number;
}

export interface Complexity {
  time: string;
  space: string;
}

export interface AIResponse {
  quality_analysis: string;
  issues: Issue[];
  improvements: Improvement[];
  explanation: string;
  edge_cases: string[];
  test_cases: TestCase[];
  optimized_code: string;
  converted_code: string;
  complexity: Complexity;
  score: Score;
}

export interface ReviewResult {
  reviewId: string;
  language: string;
  fileName?: string;
  title?: string;
  compilationStatus: string;
  currentOutput?: string;
  aiResponse: AIResponse;
  score: number;
  processingTime: number;
  createdAt: string;
}

/**
 * Execute code and get AI analysis
 */
export interface AnalyzeResult {
  output: string;
  analysis: AIResponse;
}

export interface ReviewHistoryItem {
  _id: string;
  language: string;
  fileName?: string;
  title?: string;
  score: number;
  createdAt: string;
  processingTime: number;
  aiResponse: {
    score: Score;
  };
}

export interface DashboardStats {
  totalReviews: number;
  averageScore: number;
  mostUsedLanguage: string | null;
  languageCounts: Record<string, number>;
  recentReviews: ReviewHistoryItem[];
}

export interface PaginatedReviews {
  reviews: ReviewHistoryItem[];
  pagination: {
    current: number;
    total: number;
    totalReviews: number;
    hasMore: boolean;
  };
}

// ─── Review API ───────────────────────────────────────────────────────────────

export const reviewService = {
  /**
   * Submit code text for AI analysis
   */
  reviewCode: async (code: string, language: string, targetLanguage?: string): Promise<ReviewResult> => {
    const res = await api.post('/review-code', { code, language, targetLanguage });
    return res.data.data;
  },

  /**
   * Upload a code file for AI analysis
   */
  uploadCodeFile: async (file: File, targetLanguage?: string): Promise<ReviewResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (targetLanguage) {
      formData.append('targetLanguage', targetLanguage);
    }
    const res = await api.post('/upload-code', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  /**
   * Convert code to a different language (no analysis)
   */
  convertCode: async (code: string, language: string, targetLanguage: string): Promise<{ convertedCode: string; processingTime: number }> => {
    const res = await api.post('/convert-code', { code, language, targetLanguage });
    return res.data.data;
  },

  /**
   * Fetch paginated review history
   */
  getReviews: async (page = 1, limit = 10): Promise<PaginatedReviews> => {
    const res = await api.get(`/reviews?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  /**
   * Fetch a single review by ID
   */
  getReviewById: async (id: string): Promise<ReviewHistoryItem & { code: string; aiResponse: AIResponse }> => {
    const res = await api.get(`/reviews/${id}`);
    return res.data.data;
  },

  /**
   * Fetch dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/reviews/stats');
    return res.data.data;
  },

  /**
   * Delete a review by ID
   */
  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },

  /**
   * Fetch a public (unauthenticated) review by ID
   */
  getPublicReview: async (id: string): Promise<ReviewHistoryItem & { code: string; aiResponse: AIResponse }> => {
    const res = await api.get(`/review/${id}/public`);
    return res.data.data;
  },
};

// ─── Analyze API ──────────────────────────────────────────────────────────────

export const analyzeService = {
  /**
   * Execute code in Docker sandbox and get AI analysis
   */
  analyze: async (code: string, language: string): Promise<AnalyzeResult> => {
    const res = await api.post('/analyze', { code, language });
    return res.data;
  },
};
