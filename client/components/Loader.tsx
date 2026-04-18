'use client';

interface LoaderProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'analyzing' | 'fullpage';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loader({ variant = 'spinner', text, size = 'md' }: LoaderProps) {
  if (variant === 'fullpage') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
          {text && <p className="text-sm text-slate-500">{text}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'analyzing') {
    return (
      <div className="card-glow p-10 text-center animate-fade-in">
        {/* Animated rings */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-sky-500/20 animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Analyzing your code…</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
          GPT-4 is scanning for bugs, optimizations, and quality issues. Usually 10–30 seconds.
        </p>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
          {['Parsing code', 'Detecting bugs', 'Scoring quality', 'Generating report'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 text-slate-600">
              <div
                className="w-1.5 h-1.5 rounded-full bg-sky-400 dot-bounce"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-sky-400 dot-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
        {text && <span className="text-sm text-slate-400 ml-1">{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
    return (
      <div className={`${sizes[size]} rounded-full flex items-center justify-center`} style={{ background: 'rgba(14,165,233,0.1)' }}>
        <div className={`${sizes[size]} rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin absolute`} />
      </div>
    );
  }

  // Default: spinner
  const sizes = { sm: 'w-5 h-5 border-[2px]', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-2' };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} rounded-full border-sky-500/20 border-t-sky-500 animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
