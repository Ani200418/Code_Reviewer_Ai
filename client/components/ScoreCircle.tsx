'use client';

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
  showLabel?: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 85) return { color: '#10b981', glow: 'rgba(16,185,129,0.4)', label: 'Excellent' };
  if (score >= 70) return { color: '#38bdf8', glow: 'rgba(56,189,248,0.4)', label: 'Good' };
  if (score >= 55) return { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Fair' };
  if (score >= 40) return { color: '#f97316', glow: 'rgba(249,115,22,0.4)', label: 'Poor' };
  return { color: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'Critical' };
};

export default function ScoreCircle({
  score,
  size = 120,
  strokeWidth = 7,
  label,
  animate = true,
  showLabel = true,
}: ScoreCircleProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const [drawn, setDrawn] = useState(animate ? 0 : score);

  const center = size / 2;
  const radius = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const { color, glow, label: autoLabel } = getScoreConfig(score);

  useEffect(() => {
    if (!animate) return;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplayed(Math.round(eased * score));
      setDrawn(eased * score);
      if (progress < 1) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  const offset = circumference - (drawn / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow layer */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 2}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            opacity={0.15}
            style={{ filter: `blur(4px)` }}
          />
        </svg>

        {/* Track */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(30,41,59,0.9)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${glow})`,
              transition: 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none tabular-nums"
            style={{
              fontSize: size * 0.225,
              color,
              textShadow: `0 0 12px ${glow}`,
            }}
          >
            {displayed}
          </span>
          <span
            className="font-medium"
            style={{ fontSize: size * 0.11, color: 'rgba(148,163,184,0.7)', marginTop: 2 }}
          >
            /100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-semibold" style={{ color }}>
            {label || autoLabel}
          </p>
        </div>
      )}
    </div>
  );
}
