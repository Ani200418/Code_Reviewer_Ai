'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RiCodeSSlashLine, RiStarLine, RiHistoryLine,
  RiArrowRightLine, RiLoader4Line, RiSparklingLine,
} from 'react-icons/ri';
import { reviewService, DashboardStats } from '@/lib/services';
import {
  getScoreColor, getScoreBarColor, getScoreLabel,
  timeAgo, capitalize,
} from '@/lib/utils';
import { useAuth } from '@/lib/context/AuthContext';
import ScoreCircle from '@/components/ScoreCircle';

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="card-glow p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reviewService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RiLoader4Line size={28} className="animate-spin text-purple-400 opacity-60" />
      </div>
    );
  }

  const hasReviews = (stats?.totalReviews ?? 0) > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here's your code review activity at a glance.
          </p>
        </div>
        <Link href="/dashboard/review" className="btn-gradient text-sm">
          <RiSparklingLine size={15} /> New Review
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Reviews" value={stats?.totalReviews ?? 0}
          icon={<RiCodeSSlashLine size={18} />} accent="#38bdf8" />
        <StatCard
          label="Average Score"
          value={stats?.averageScore ? `${stats.averageScore}/100` : '—'}
          sub={stats?.averageScore ? getScoreLabel(stats.averageScore) : undefined}
          icon={<RiStarLine size={18} />} accent="#f59e0b" />
        <StatCard
          label="Top Language"
          value={stats?.mostUsedLanguage ? capitalize(stats.mostUsedLanguage) : '—'}
          sub={stats?.mostUsedLanguage && stats.languageCounts[stats.mostUsedLanguage]
            ? `${stats.languageCounts[stats.mostUsedLanguage]} reviews` : undefined}
          icon={<RiHistoryLine size={18} />} accent="#a78bfa" />
      </div>

      {!hasReviews ? (
        /* Empty state */
        <div className="card-glow p-14 text-center"
             style={{ borderStyle: 'dashed', borderColor: 'rgba(168,85,247,0.15)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
               style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <RiSparklingLine size={30} className="text-purple-400 animate-float" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No reviews yet</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Submit your first code snippet and get instant AI-powered feedback on bugs, optimizations, and quality.
          </p>
          <Link href="/dashboard/review" className="btn-gradient inline-flex">
            Start Your First Review <RiArrowRightLine size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Language breakdown */}
          {stats?.languageCounts && Object.keys(stats.languageCounts).length > 0 && (
            <div className="card-glow p-5">
              <p className="section-label">Language Breakdown</p>
              <div className="space-y-3">
                {Object.entries(stats.languageCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => {
                    const pct = stats.totalReviews > 0
                      ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={lang}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-300 font-medium capitalize">{lang}</span>
                          <span className="text-slate-600 text-xs">{count} review{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="score-track">
                          <div className="score-fill"
                               style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent reviews */}
          <div className="card-glow p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label mb-0">Recent Reviews</p>
              <Link href="/dashboard/history"
                    className="text-xs text-purple-400 hover:text-sky-300 transition-colors flex items-center gap-1 font-medium">
                View all <RiArrowRightLine size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {stats?.recentReviews.map((r) => (
                <Link key={r._id} href={`/dashboard/history/${r._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
                      style={{ background: 'rgba(30,41,59,0.4)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.4)')}>
                  <span className="badge-sky text-xs capitalize flex-shrink-0">{r.language}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 font-medium truncate">
                      {r.fileName || `${capitalize(r.language)} snippet`}
                    </p>
                    <p className="text-xs text-slate-600">{timeAgo(r.createdAt)}</p>
                  </div>
                  <span className="text-lg font-bold flex-shrink-0" style={{ color: r.score >= 80 ? '#10b981' : r.score >= 60 ? '#c084fc' : r.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                    {r.score}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/dashboard/review" className="btn-gradient w-full justify-center mt-4">
              <RiSparklingLine size={15} /> New Review
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
