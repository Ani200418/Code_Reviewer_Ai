/**
 * Utility Functions
 */

/**
 * Get a color class based on score value
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export const getScoreBarColor = (score: number): string => {
  if (score >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-400';
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
  if (score >= 40) return 'bg-gradient-to-r from-orange-500 to-amber-400';
  return 'bg-gradient-to-r from-red-500 to-rose-400';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Average';
  if (score >= 40) return 'Below Average';
  if (score >= 30) return 'Poor';
  return 'Critical';
};

/**
 * Get language display label and Monaco language ID
 */
export const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript', monacoId: 'javascript', ext: '.js' },
  { value: 'typescript', label: 'TypeScript', monacoId: 'typescript', ext: '.ts' },
  { value: 'python', label: 'Python', monacoId: 'python', ext: '.py' },
  { value: 'java', label: 'Java', monacoId: 'java', ext: '.java' },
  { value: 'cpp', label: 'C++', monacoId: 'cpp', ext: '.cpp' },
  { value: 'go', label: 'Go', monacoId: 'go', ext: '.go' },
  { value: 'rust', label: 'Rust', monacoId: 'rust', ext: '.rs' },
  { value: 'other', label: 'Other', monacoId: 'plaintext', ext: '' },
] as const;

export type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]['value'];

export const getLanguageOption = (value: string) =>
  LANGUAGE_OPTIONS.find((l) => l.value === value) ?? LANGUAGE_OPTIONS[7];

export const getMonacoLanguage = (value: string): string =>
  getLanguageOption(value).monacoId;

/**
 * Format date in human-readable form
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
};

/**
 * Format processing time
 */
export const formatProcessingTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Extract error message from axios error
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; errors?: string[] } } };
    const data = axiosError.response?.data;
    if (data?.errors?.length) return data.errors.join('. ');
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
