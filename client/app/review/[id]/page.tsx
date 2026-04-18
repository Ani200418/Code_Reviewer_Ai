'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiTerminalBoxLine, RiCodeSSlashLine } from 'react-icons/ri';
import { reviewService, ReviewHistoryItem, AIResponse } from '@/lib/services';
import ReviewCard from '@/components/ReviewCard';
import Loader from '@/components/Loader';
import { extractErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PublicReviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [review, setReview] = useState<(ReviewHistoryItem & { code: string; aiResponse: AIResponse }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await reviewService.getPublicReview(id);
        setReview(data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id, router]);

  if (loading) {
    return <Loader variant="analyzing" />;
  }

  if (!review) return null;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')}
            className="btn-ghost p-2 rounded-xl"
          >
            <RiArrowLeftLine size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <RiTerminalBoxLine className="text-purple-400" />
              Shared Code Review
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Read-only public link · Analyzed on {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="badge-sky capitalize font-medium px-3 py-1.5 shadow-lg shadow-sky-500/10">
          {review.language}
        </div>
      </div>

      {/* Code Section */}
      <div className="card-glow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <RiCodeSSlashLine className="text-sky-400" /> Original Code
          </span>
          {review.fileName && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50">
              {review.fileName}
            </span>
          )}
        </div>
        <div className="p-4 bg-[#0d1117] overflow-x-auto border-b border-[rgba(192,132,252,0.08)]">
          <code className="text-sm font-mono text-slate-300 whitespace-pre">
            {review.code}
          </code>
        </div>
      </div>

      {/* Review Results */}
      <div className="pt-4">
        <ReviewCard result={review.aiResponse} processingTime={review.processingTime} />
      </div>
      
      {/* Footer watermark */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-slate-600 font-medium">
          Analyzed by CodeReviewerAI
        </p>
      </div>
    </div>
  );
}
