'use client';

import { useEffect, useRef } from 'react';
import { Score } from '@/lib/services';
import { getScoreColor, getScoreBarColor, getScoreLabel } from '@/lib/utils';

interface ScoreDisplayProps {
  score: Score;
}

const ScoreRing = ({ value, size = 96 }: { value: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? '#22c55e' :
    value >= 60 ? '#f59e0b' :
    value >= 40 ? '#f97316' :
    '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30,45,77,1)"
          strokeWidth={6}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-ring transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-white leading-none">{value}</span>
      </div>
    </div>
  );
};

const ScoreBar = ({
  label, value,
}: {
  label: string; value: number;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-semibold ${getScoreColor(value)}`}>{value}/100</span>
    </div>
    <div className="score-bar-track">
      <div
        className={`score-bar-fill ${getScoreBarColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="card p-6">
      <p className="section-heading">Quality Score</p>

      {/* Main score ring */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing value={score.overall} size={110} />
          <div className="text-center">
            <p className={`text-sm font-semibold ${getScoreColor(score.overall)}`}>
              {getScoreLabel(score.overall)}
            </p>
            <p className="text-xs text-slate-500">Overall Score</p>
          </div>
        </div>

        {/* Mini rings row */}
        <div className="flex gap-6 flex-1 flex-wrap justify-center sm:justify-start">
          {[
            { label: 'Readability', value: score.readability },
            { label: 'Efficiency', value: score.efficiency },
            { label: 'Best Practices', value: score.best_practices },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <ScoreRing value={s.value} size={72} />
              <p className="text-xs text-slate-400 text-center leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed bars */}
      <div className="space-y-4 border-t border-[rgba(56,189,248,0.08)] pt-5">
        <ScoreBar label="Readability" value={score.readability} />
        <ScoreBar label="Efficiency" value={score.efficiency} />
        <ScoreBar label="Best Practices" value={score.best_practices} />
      </div>
    </div>
  );
}
