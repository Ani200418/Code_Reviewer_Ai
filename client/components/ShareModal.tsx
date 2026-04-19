'use client';

import { useState, useEffect } from 'react';
import {
  RiCloseLine, RiLinkM, RiTwitterXFill, RiLinkedinBoxFill,
  RiCheckLine, RiDownload2Line, RiShareLine,
} from 'react-icons/ri';
import { AIResponse } from '@/lib/services';

interface ShareModalProps {
  reviewId: string;
  language: string;
  score: number;
  aiResponse: AIResponse;
  onClose: () => void;
}

export default function ShareModal({ reviewId, language, score, aiResponse, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/review/${reviewId}`;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTwitter = () => {
    const scoreLabel = score >= 80 ? 'Great' : score >= 60 ? 'Good' : 'Needs Work';
    const issuesCount = aiResponse.issues?.length || 0;
    const improvementsCount = aiResponse.improvements?.length || 0;
    const text = encodeURIComponent(
      `Just reviewed my ${language} code with AI!\n\n📊 Score: ${score}/100 (${scoreLabel})\n🐛 Issues: ${issuesCount} found\n⚡ Improvements: ${improvementsCount} suggested\n\nCheck it out 👇\n${publicUrl}\n\n#CodeReview #${language} #AI #Dev`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(publicUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleDownloadJSON = () => {
    const report = {
      meta: {
        reviewId,
        language,
        generatedAt: new Date().toISOString(),
        publicUrl,
        credit: 'Built with CodeReviewerAI by Aniket Singh',
      },
      score: aiResponse.score,
      issues: aiResponse.issues,
      improvements: aiResponse.improvements,
      explanation: aiResponse.explanation,
      edge_cases: aiResponse.edge_cases,
      test_cases: aiResponse.test_cases,
      optimized_code: aiResponse.optimized_code,
      converted_code: aiResponse.converted_code,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code-review-${reviewId.slice(-8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,8,20,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card-glow w-full max-w-md animate-scale-in" style={{ background: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(192,132,252,0.10)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <RiShareLine size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">Share Review</h3>
              <p className="text-xs text-[var(--text-muted)]">Public read-only link</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <RiCloseLine size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Score preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(192,132,252,0.14)' }}>
            <div className="text-2xl font-bold" style={{ color: score >= 80 ? '#10b981' : score >= 60 ? '#c084fc' : '#f59e0b' }}>
              {score}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] capitalize">{language} code review</p>
              <p className="text-xs text-[var(--text-muted)]">{aiResponse.issues?.length || 0} issues · {aiResponse.improvements?.length || 0} improvements</p>
            </div>
            <span className="badge-sky ml-auto">Public</span>
          </div>

          {/* URL box */}
          <div>
            <label className="label">Shareable Link</label>
            <div className="flex gap-2">
              <div className="input flex-1 text-xs text-slate-400 font-mono truncate py-2.5 cursor-text select-all">
                {publicUrl}
              </div>
              <button onClick={handleCopy} className={`btn px-3 py-2 rounded-xl flex-shrink-0 ${copied ? 'btn-secondary' : 'btn-primary'}`}>
                {copied ? <RiCheckLine size={16} className="text-green-400" /> : <RiLinkM size={16} />}
              </button>
            </div>
            {copied && <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1"><RiCheckLine size={12} /> Copied to clipboard!</p>}
          </div>

          {/* Social share */}
          <div>
            <label className="label">Share on Social</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleTwitter} className="btn-secondary justify-center py-2.5">
                <RiTwitterXFill size={15} /> Share on X
              </button>
              <button onClick={handleLinkedIn} className="btn-secondary justify-center py-2.5" style={{ color: '#c084fc' }}>
                <RiLinkedinBoxFill size={15} /> LinkedIn
              </button>
            </div>
          </div>

          {/* Download JSON */}
          <div className="divider pt-1" />
          <button onClick={handleDownloadJSON} className="btn-ghost w-full justify-center py-2.5 text-sm">
            <RiDownload2Line size={15} /> Download JSON Report
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4">
          <p className="text-center text-xs text-[var(--text-muted)]">
            Built with ❤️ by <span className="text-[var(--text-muted)] font-medium">Aniket Singh</span>
          </p>
        </div>
      </div>
    </div>
  );
}
