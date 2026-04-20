'use client';

import { useState } from 'react';
import {
  RiBugLine, RiLightbulbLine, RiInformationLine,
  RiTestTubeLine, RiAlertLine, RiCheckLine, RiFileCopyLine,
  RiArrowDownSLine, RiCodeSSlashLine
} from 'react-icons/ri';
import { AIResponse } from '@/lib/services';
import ScoreCircle from './ScoreCircle';
import CompilationError from './CompilationError';

interface ReviewCardProps {
  result: AIResponse | any;  // Can be AIResponse or CompilationError response
  processingTime?: number;
  animate?: boolean;
  compilationStatus?: string;
  currentOutput?: string;
}

/* ─── Collapsible section ─────────────────────────────────────────── */
function Section({
  icon, title, color, bg, count, children, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; color: string; bg: string;
  count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 p-5 text-left transition-colors hover:bg-[rgba(168,85,247,0.04)]"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1 flex items-center gap-2.5">
          <span className="font-semibold text-[var(--text-primary)] text-sm">{title}</span>
          {count !== undefined && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: count === 0 ? 'rgba(71,85,105,0.3)' : `${bg}`,
                color: count === 0 ? '#475569' : color,
              }}
            >
              {count}
            </span>
          )}
        </div>
        <RiArrowDownSLine
          size={16}
          className="text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className="px-5 pb-5 animate-fade-in"
          style={{ borderTop: '1px solid rgba(192,132,252,0.09)' }}
        >
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ─── Copy button ─────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg transition-all"
      style={{ color: copied ? '#34d399' : '#475569' }}
    >
      {copied ? <RiCheckLine size={13} /> : <RiFileCopyLine size={13} />}
    </button>
  );
}

/* ─── Score bar ───────────────────────────────────────────────────── */
function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#c084fc' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewCard({
  result,
  processingTime,
  animate = true,
  compilationStatus,
  currentOutput,
}: ReviewCardProps) {
  // Guard against undefined result
  if (!result) {
    return <div className="text-slate-400 text-sm">No results available</div>;
  }

  // Handle compilation error case
  if (result?.compilationStatus === 'Error' || result?.compilationError) {
    return (
      <CompilationError
        error={result.compilationError}
        language={result.language}
        fileName={result.fileName}
        code={result.code}
        suggestion={result.suggestion}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { score, issues, improvements, explanation, edge_cases, test_cases, optimized_code, converted_code } = result as any;

  return (
    <div className={`space-y-4 ${animate ? 'animate-slide-up' : ''}`}>
      {/* ── Compilation Status ── */}
      {compilationStatus && (
        <div className="card-glow p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: compilationStatus === 'Success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                {compilationStatus === 'Success' ? (
                  <RiCheckLine size={18} className="text-green-400" />
                ) : (
                  <RiAlertLine size={18} className="text-red-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compilation Status</p>
                <p className="text-sm font-semibold" style={{ color: compilationStatus === 'Success' ? '#10b981' : '#f87171' }}>
                  {compilationStatus}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Execution Output ── */}
      {currentOutput !== undefined && (
        <div className="card-glow p-5">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Execution Output</p>
              <code
                className="block text-xs font-mono p-3 rounded-lg whitespace-pre-wrap break-all max-h-48 overflow-y-auto"
                style={{
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#cbd5e1',
                }}
              >
                {currentOutput || '(No output)'}
              </code>
            </div>
          </div>
        </div>
      )}
      {/* ── Score Dashboard ── */}
      <div className="card-glow p-6">
        <div className="section-label">Quality Analysis</div>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main ring */}
          <div className="flex items-center gap-6">
            <ScoreCircle score={score.overall} size={120} />
            <div className="space-y-4 flex-1 min-w-0 lg:hidden">
              <ScoreBar label="Readability" value={score.readability} />
              <ScoreBar label="Efficiency" value={score.efficiency} />
              <ScoreBar label="Best Practices" value={score.best_practices} />
            </div>
          </div>

          {/* Mini scores */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Readability', value: score.readability },
              { label: 'Efficiency', value: score.efficiency },
              { label: 'Best Practices', value: score.best_practices },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center"
                style={{ minWidth: 80 }}
              >
                <ScoreCircle score={s.value} size={80} strokeWidth={5} showLabel={false} />
                <p className="text-xs text-[var(--text-muted)] mt-1.5 text-center">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="hidden lg:flex flex-col gap-3 flex-1 pt-1">
            <ScoreBar label="Readability" value={score.readability} />
            <ScoreBar label="Efficiency" value={score.efficiency} />
            <ScoreBar label="Best Practices" value={score.best_practices} />
          </div>
        </div>

        {/* Processing time */}
        {processingTime && (
          <p className="mt-4 text-xs text-[var(--text-muted)] text-right">
            Analyzed in {(processingTime / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      {/* ── Converted Code ── */}
      {converted_code && (
        <Section
          title="Converted Code"
          icon={<RiCodeSSlashLine size={16} />}
          color="#10b981"
          bg="rgba(16, 185, 129, 0.12)"
        >
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-xs font-bold text-emerald-400">Translated Code</span>
              <CopyBtn text={converted_code} />
            </div>
            <div className="p-4 bg-[#0d1117] overflow-x-auto">
              <code className="text-sm font-mono text-slate-300 whitespace-pre">
                {converted_code}
              </code>
            </div>
          </div>
        </Section>
      )}

      {/* ── Optimized Code ── */}
      {optimized_code && (
        <Section
          title="Optimized Code"
          icon={<RiCodeSSlashLine size={16} />}
          color="#8b5cf6"
          bg="rgba(139, 92, 246, 0.12)"
        >
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-xs font-bold text-violet-400">Improved Version</span>
              <CopyBtn text={optimized_code} />
            </div>
            <div className="p-4 bg-[#0d1117] overflow-x-auto">
              <code className="text-sm font-mono text-slate-300 whitespace-pre">
                {optimized_code}
              </code>
            </div>
          </div>
        </Section>
      )}

      {/* ── Explanation ── */}
      <Section
        title="Code Explanation"
        icon={<RiInformationLine size={16} />}
        color="#38bdf8"
        bg="rgba(168,85,247,0.12)"
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{explanation}</p>
      </Section>

      {/* ── Issues ── */}
      <Section
        title="Issues Found"
        icon={<RiBugLine size={16} />}
        color="#f87171"
        bg="rgba(239,68,68,0.12)"
        count={issues?.length || 0}
      >
        {!issues || issues.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
              <RiCheckLine size={14} className="text-green-400" />
            </div>
            <p className="text-sm text-green-400 font-medium">No issues detected — excellent code!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {issues.map((issue: any, i: number) => {
              // Handle both field mappings: (severity/description) or (issue/explanation)
              const severity = issue.severity || 'medium';
              const description = issue.description || issue.issue || 'Unknown issue';
              const type = issue.type || 'bug';
              const suggestion = issue.suggestion || issue.explanation || '';
              
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ 
                          background: severity === 'high' ? 'rgba(239,68,68,0.2)' : severity === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
                          color: severity === 'high' ? '#f87171' : severity === 'medium' ? '#fbbf24' : '#38bdf8'
                        }}
                      >
                        {String(severity).toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-300">{description}</p>
                        <p className="text-xs text-slate-400 mt-1">Type: {type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-10">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Fix:</p>
                    <p className="text-sm text-[var(--text-secondary)]">{suggestion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Improvements ── */}
      <Section
        title="Improvement Suggestions"
        icon={<RiLightbulbLine size={16} />}
        color="#fbbf24"
        bg="rgba(245,158,11,0.12)"
        count={improvements?.length || 0}
      >
        {!improvements || improvements.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">Code is already well-optimized.</p>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {improvements.map((imp: any, i: number) => {
              // Handle both field mappings: (area/current/suggested) or (suggestion/impact)
              const area = imp.area || 'general';
              const suggestion = imp.suggested || imp.suggestion || '';
              const current = imp.current || '';
              const impact = imp.impact || '';
              
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <p className="text-sm font-semibold text-amber-300 mb-2">
                    {String(area).charAt(0).toUpperCase() + String(area).slice(1)}: {suggestion}
                  </p>
                  {current && (
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400">Current:</span>
                        <p className="text-slate-300 mt-0.5">{current}</p>
                      </div>
                    </div>
                  )}
                  {impact && (
                    <div className="text-xs">
                      <span className="text-amber-400 font-medium">Impact:</span>
                      <p className="text-slate-300">{impact}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Edge Cases ── */}
      <Section
        title="Edge Cases to Consider"
        icon={<RiAlertLine size={16} />}
        color="#fb923c"
        bg="rgba(249,115,22,0.12)"
        count={edge_cases.length}
        defaultOpen={false}
      >
        {edge_cases.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">No notable edge cases identified.</p>
        ) : (
          <ul className="space-y-2.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {edge_cases.map((ec: any, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                {ec}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── Test Cases ── */}
      <Section
        title="Test Cases & Execution"
        icon={<RiTestTubeLine size={16} />}
        color="#a78bfa"
        bg="rgba(139,92,246,0.12)"
        count={test_cases.length}
        defaultOpen={false}
      >
        {/* Generated test cases */}
        {test_cases.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">No test cases generated.</p>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {test_cases.map((tc: any, i: number) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2"
                  style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}
                >
                  <span className="text-xs font-bold text-violet-400">Test {i + 1}</span>
                  <CopyBtn text={`Input: ${tc.input}\nExpected: ${tc.expected_output}`} />
                </div>
                <div className="p-4 space-y-3" style={{ background: 'rgba(139,92,246,0.04)' }}>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Input</p>
                    <code className="block text-xs font-mono text-[var(--text-secondary)] bg-[#0d1117] px-3 py-2 rounded-lg whitespace-pre-wrap break-all">
                      {tc.input}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Expected Output</p>
                    <code className="block text-xs font-mono text-green-400 bg-green-500/5 border border-green-500/10 px-3 py-2 rounded-lg whitespace-pre-wrap break-all">
                      {tc.expected_output}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
