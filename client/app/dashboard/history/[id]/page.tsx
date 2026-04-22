'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiTerminalBoxLine, RiCodeSSlashLine, RiMagicLine } from 'react-icons/ri';
import { reviewService, ReviewHistoryItem, AIResponse } from '@/lib/services';
import Loader from '@/components/Loader';
import { extractErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import ScoreDisplay from '@/components/ScoreDisplay';

export default function HistoryDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [review, setReview] = useState<(ReviewHistoryItem & { code: string; aiResponse: AIResponse }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await reviewService.getReviewById(id);
        setReview(data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
        router.push('/dashboard/history');
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

  const { aiResponse } = review;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard/history')}
            className="btn-ghost p-2 rounded-xl hover:bg-slate-700/50 transition"
          >
            <RiArrowLeftLine size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <RiTerminalBoxLine className="text-purple-400" />
              Code Review Details
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Analyzed on {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="badge-sky capitalize font-medium px-3 py-1.5 shadow-lg shadow-sky-500/10">
          {review.language}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Code */}
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

          {/* Issues */}
          {aiResponse.issues && aiResponse.issues.length > 0 && (
            <div className="card-glow overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/50 border-b border-red-500/20">
                <h2 className="font-bold text-red-400 text-sm">Issues Found</h2>
              </div>
              <div className="p-4 space-y-3">
                {aiResponse.issues.map((issue, i) => (
                  <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-red-400 font-semibold text-sm">{issue.issue || (issue as any).description}</p>
                    <p className="text-slate-400 text-sm mt-1">{issue.suggestion || issue.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {aiResponse.improvements && aiResponse.improvements.length > 0 && (
            <div className="card-glow overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/50 border-b border-yellow-500/20">
                <h2 className="font-bold text-yellow-400 text-sm">Improvement Suggestions</h2>
              </div>
              <div className="p-4 space-y-3">
                {aiResponse.improvements.map((imp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-yellow-400 font-semibold text-sm">{imp.suggestion || (imp as any).suggested}</p>
                    <p className="text-slate-400 text-sm mt-1">{imp.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimized Code */}
          {aiResponse.optimized_code && (
            <div className="card-glow overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-green-500/20">
                <span className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <RiMagicLine /> Optimized Code
                </span>
              </div>
              <div className="p-4 bg-[#0d1117] overflow-x-auto border-b border-[rgba(34,197,94,0.1)]">
                <code className="text-sm font-mono text-slate-300 whitespace-pre">
                  {aiResponse.optimized_code}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score Card */}
          {aiResponse.score && (
            <div className="card-glow p-5">
              <h3 className="font-bold text-white mb-4 text-center">Code Quality Score</h3>
              <ScoreDisplay score={aiResponse.score} />
            </div>
          )}

          {/* Quality Analysis */}
          {aiResponse.quality_analysis && (
            <div className="card-glow p-5">
              <h3 className="font-bold text-purple-400 mb-3 text-sm flex items-center gap-2">
                <RiMagicLine size={16} /> Quality Analysis
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {aiResponse.quality_analysis}
              </p>
            </div>
          )}

          {/* Explanation Card */}
          {aiResponse.explanation && (
            <div className="card-glow p-5">
              <h3 className="font-bold text-white mb-3 text-sm">Step-by-step Explanation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {aiResponse.explanation}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="card-glow p-5 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Processing Time:</span>
              <span className="text-slate-300">{review.processingTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Review ID:</span>
              <span className="text-slate-400 font-mono text-xs truncate">{review._id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
