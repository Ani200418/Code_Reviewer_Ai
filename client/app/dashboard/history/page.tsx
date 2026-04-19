'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  RiHistoryLine, RiLoader4Line, RiArrowRightLine,
  RiDeleteBin6Line, RiSparklingLine, RiShareLine,
} from 'react-icons/ri';
import { reviewService, ReviewHistoryItem } from '@/lib/services';
import {
  timeAgo, formatProcessingTime,
} from '@/lib/utils';
import ShareModal from '@/components/ShareModal';

export default function HistoryPage() {
  const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, total: 1, totalReviews: 0, hasMore: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareReview, setShareReview] = useState<ReviewHistoryItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullShareData, setFullShareData] = useState<any>(null);

  const fetchReviews = async (page = 1) => {
    const data = await reviewService.getReviews(page, 15);
    if (page === 1) setReviews(data.reviews);
    else setReviews(prev => [...prev, ...data.reviews]);
    setPagination(data.pagination);
  };

  useEffect(() => {
    fetchReviews(1).finally(() => setIsLoading(false));
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    await fetchReviews(pagination.current + 1);
    setIsLoadingMore(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this review permanently?')) return;
    setDeletingId(id);
    try {
      await reviewService.deleteReview(id);
      setReviews(prev => prev.filter(r => r._id !== id));
      setPagination(p => ({ ...p, totalReviews: p.totalReviews - 1 }));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const handleShare = async (review: ReviewHistoryItem, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const full = await reviewService.getReviewById(review._id);
      setFullShareData(full);
      setShareReview(review);
    } catch { toast.error('Failed to load review data'); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RiLoader4Line size={28} className="animate-spin text-sky-400 opacity-60" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review History</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination.totalReviews} total review{pagination.totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/review" className="btn-gradient text-sm">
          <RiSparklingLine size={15} /> New Review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="card-glow p-14 text-center" style={{ borderStyle:'dashed', borderColor:'rgba(56,189,248,0.15)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.12)' }}>
            <RiHistoryLine size={26} className="text-slate-600" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No reviews yet</h2>
          <p className="text-slate-500 text-sm mb-5">Your history will appear here after your first review.</p>
          <Link href="/dashboard/review" className="btn-gradient inline-flex">
            Start First Review <RiArrowRightLine size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map(review => (
            <Link key={review._id} href={`/dashboard/history/${review._id}`}
                  className="card-hover flex items-center gap-4 p-4 group">
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                   style={{ background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.12)' }}>
                {review.language === 'python' ? '🐍' : review.language === 'java' ? '☕' :
                 review.language === 'cpp' ? '⚙️' : review.language === 'go' ? '🔵' :
                 review.language === 'rust' ? '🦀' : review.language === 'typescript' ? '🔷' : '📄'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="badge-sky text-xs capitalize">{review.language}</span>
                  {review.fileName && (
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[180px]">{review.fileName}</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {timeAgo(review.createdAt)}
                  {review.processingTime ? ` · ${formatProcessingTime(review.processingTime)}` : ''}
                </p>
              </div>

              {/* Score mini bar */}
              <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0 w-20">
                <span className="text-xs font-bold" style={{ color: review.score >= 80 ? '#10b981' : review.score >= 60 ? '#38bdf8' : review.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {review.score}/100
                </span>
                <div className="score-track w-full">
                  <div className="score-fill" style={{ width:`${review.score}%`, background: review.score >= 80 ? '#10b981' : review.score >= 60 ? '#38bdf8' : review.score >= 40 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>

              {/* Score number (mobile) */}
              <span className="sm:hidden text-lg font-bold flex-shrink-0" style={{ color: review.score >= 80 ? '#10b981' : '#f59e0b' }}>
                {review.score}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={e => handleShare(review, e)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-sky-400 transition-colors"
                        title="Share">
                  <RiShareLine size={14} />
                </button>
                <button onClick={e => handleDelete(review._id, e)} disabled={deletingId === review._id}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors" title="Delete">
                  {deletingId === review._id
                    ? <RiLoader4Line size={14} className="animate-spin" />
                    : <RiDeleteBin6Line size={14} />}
                </button>
              </div>

              <RiArrowRightLine size={14} className="text-slate-700 group-hover:text-sky-400 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {pagination.hasMore && (
        <div className="text-center pt-2">
          <button onClick={loadMore} disabled={isLoadingMore} className="btn-secondary">
            {isLoadingMore ? <><RiLoader4Line size={14} className="animate-spin" /> Loading…</> : 'Load More'}
          </button>
        </div>
      )}

      {shareReview && fullShareData && (
        <ShareModal
          reviewId={shareReview._id}
          language={shareReview.language}
          score={shareReview.score}
          aiResponse={fullShareData.aiResponse}
          onClose={() => { setShareReview(null); setFullShareData(null); }}
        />
      )}
    </div>
  );
}
