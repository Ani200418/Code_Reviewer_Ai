'use client';

/**
 * ReviewResults — thin wrapper that delegates to ReviewCard.
 * Keeps the component name for backwards compatibility with any page that imports it.
 */
import { AIResponse } from '@/lib/services';
import ReviewCard from './ReviewCard';

interface ReviewResultsProps {
  result: AIResponse | any;
  processingTime?: number;
}

export default function ReviewResults({ result, processingTime }: ReviewResultsProps) {
  return <ReviewCard result={result} processingTime={processingTime} />;
}
