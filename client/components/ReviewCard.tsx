'use client';

import { useState } from 'react';
import {
  RiBugLine, RiLightbulbLine, RiInformationLine,
  RiTestTubeLine, RiAlertLine, RiCheckLine, RiFileCopyLine,
  RiArrowDownSLine, RiCodeSSlashLine, RiShieldLine, RiSpeedLine,
  RiPaintBrushLine, RiTimeLine, RiDatabase2Line, RiMedalLine,
  RiFileTextLine,
} from 'react-icons/ri';
import { AIResponse } from '@/lib/services';
import ScoreCircle from './ScoreCircle';
import CompilationError from './CompilationError';

interface ReviewCardProps {
  result: AIResponse | any;
  processingTime?: number;
  animate?: boolean;
  compilationStatus?: string;
  currentOutput?: string;
}

// ─── Severity config ───────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  high:   { bg: 'rgba(239,68,68,0.18)',   color: '#f87171', label: 'HIGH'   },
  medium: { bg: 'rgba(245,158,11,0.18)',  color: '#fbbf24', label: 'MED'    },
  low:    { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8', label: 'LOW'    },
};

// ─── Issue type config ─────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  bug:         { icon: <RiBugLine size={11} />,         color: '#f87171', label: 'Bug'         },
  performance: { icon: <RiSpeedLine size={11} />,       color: '#fbbf24', label: 'Performance' },
  security:    { icon: <RiShieldLine size={11} />,      color: '#fb923c', label: 'Security'    },
  style:       { icon: <RiPaintBrushLine size={11} />,  color: '#c084fc', label: 'Style'       },
};

// ─── Test case category config ─────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  normal: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', label: 'Normal' },
  edge:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', label: 'Edge'   },
  corner: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Corner' },
};

/* ─── Collapsible section ──────────────────────────────────────────────────── */
function Section({
  icon, title, color, bg, count, children, defaultOpen = true, id,
}: {
  icon: React.ReactNode; title: string; color: string; bg: string;
  count?: number; children: React.ReactNode; defaultOpen?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="card overflow-hidden transition-all duration-200">
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
                background: count === 0 ? 'rgba(71,85,105,0.3)' : bg,
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

/* ─── Copy button ─────────────────────────────────────────────────────────── */
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
      title="Copy to clipboard"
    >
      {copied ? <RiCheckLine size={13} /> : <RiFileCopyLine size={13} />}
    </button>
  );
}

/* ─── Score bar ──────────────────────────────────────────────────────────── */
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

/* ─── Code block ─────────────────────────────────────────────────────────── */
function CodeBlock({ code, label, labelColor }: { code: string; label: string; labelColor: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-xs font-bold" style={{ color: labelColor }}>{label}</span>
        <CopyBtn text={code} />
      </div>
      <div className="p-4 bg-[#0d1117] overflow-x-auto">
        <code className="text-sm font-mono text-slate-300 whitespace-pre">{code}</code>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewCard({
  result,
  processingTime,
  animate = true,
  compilationStatus,
  currentOutput,
}: ReviewCardProps) {
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
  const {
    quality_analysis = '',
    score,
    issues = [],
    improvements = [],
    explanation = '',
    edge_cases = [],
    test_cases = [],
    optimized_code = '',
    converted_code = '',
    complexity,
  } = result as any;

  // Detect if this is a conversion-only result (no score means it's conversion only)
  const isConversion = !score || !score.overall;

  return (
    <div className={`space-y-4 ${animate ? 'animate-slide-up' : ''}`}>

      {/* ── Compilation Status ── */}
      {compilationStatus && (
        <div className="card-glow p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: compilationStatus === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                {compilationStatus === 'Success'
                  ? <RiCheckLine size={18} className="text-green-400" />
                  : <RiAlertLine size={18} className="text-red-400" />}
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
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Execution Output</p>
          <code
            className="block text-xs font-mono p-3 rounded-lg whitespace-pre-wrap break-all max-h-48 overflow-y-auto"
            style={{ background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(148,163,184,0.2)', color: '#cbd5e1' }}
          >
            {currentOutput || '(No output)'}
          </code>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. 🔍 QUALITY ANALYSIS (prose section) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-quality"
        title="Quality Analysis"
        icon={<RiMedalLine size={16} />}
        color="#c084fc"
        bg="rgba(168,85,247,0.12)"
      >
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}
        >
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {quality_analysis || 'Comprehensive code quality analysis complete — see score breakdown above.'}
          </p>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Score Dashboard - HIDDEN for conversion-only */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!isConversion && (
        <div className="card-glow p-6">
          <div className="section-label">Quality Score</div>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Main ring */}
            <div className="flex items-center gap-6">
              <ScoreCircle score={score.overall} size={120} />
              <div className="space-y-4 flex-1 min-w-0 lg:hidden">
                <ScoreBar label="Readability"    value={score.readability} />
                <ScoreBar label="Efficiency"     value={score.efficiency} />
                <ScoreBar label="Best Practices" value={score.best_practices} />
              </div>
            </div>

            {/* Mini score circles */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Readability',    value: score.readability },
                { label: 'Efficiency',     value: score.efficiency },
                { label: 'Best Practices', value: score.best_practices },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center" style={{ minWidth: 80 }}>
                  <ScoreCircle score={s.value} size={80} strokeWidth={5} showLabel={false} />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 text-center">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Score bars (desktop) */}
            <div className="hidden lg:flex flex-col gap-3 flex-1 pt-1">
              <ScoreBar label="Readability"    value={score.readability} />
              <ScoreBar label="Efficiency"     value={score.efficiency} />
              <ScoreBar label="Best Practices" value={score.best_practices} />
            </div>
          </div>

          {processingTime && (
            <p className="mt-4 text-xs text-[var(--text-muted)] text-right">
              Analyzed in {(processingTime / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. ⚡ OPTIMIZED CODE */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-optimized"
        title="Optimized Code"
        icon={<RiCodeSSlashLine size={16} />}
        color="#8b5cf6"
        bg="rgba(139,92,246,0.12)"
      >
        {optimized_code ? (
          <CodeBlock code={optimized_code} label="Improved Version" labelColor="#a78bfa" />
        ) : (
          <div className="flex items-center gap-2 py-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
              <RiCheckLine size={14} className="text-violet-400" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              The code is already well-optimized — no structural changes needed.
            </p>
          </div>
        )}
      </Section>

      {/* ── Converted Code (optional) ── */}
      {converted_code && (
        <Section
          title="Converted Code"
          icon={<RiCodeSSlashLine size={16} />}
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
        >
          <CodeBlock code={converted_code} label="Translated Code" labelColor="#34d399" />
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. 🧠 CODE EXPLANATION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-explanation"
        title="Code Explanation"
        icon={<RiInformationLine size={16} />}
        color="#38bdf8"
        bg="rgba(56,189,248,0.12)"
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{explanation}</p>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Analysis Sections - HIDDEN for conversion-only */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!isConversion && (
        <>
          {/* 4. ❌ ISSUES FOUND */}
          <Section
            id="section-issues"
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
            <p className="text-sm text-green-400 font-medium">No major issues detected — excellent code!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {issues.map((issue: any, i: number) => {
              const description = issue.issue || issue.description || issue.d || 'Unknown issue';
              const suggestion  = issue.suggestion || issue.explanation || issue.fix || '';
              const severityKey = String(issue.severity || 'medium').toLowerCase() as keyof typeof SEVERITY_CONFIG;
              const typeKey     = String(issue.type || 'bug').toLowerCase() as keyof typeof TYPE_CONFIG;
              const sevCfg      = SEVERITY_CONFIG[severityKey] || SEVERITY_CONFIG.medium;
              const typeCfg     = TYPE_CONFIG[typeKey] || TYPE_CONFIG.bug;

              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  {/* Header row: severity + type badges */}
                  <div className="flex items-center gap-2 mb-2.5">
                    {/* Severity badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold tracking-wide"
                      style={{ background: sevCfg.bg, color: sevCfg.color }}
                    >
                      {sevCfg.label}
                    </span>
                    {/* Type badge */}
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: `${typeCfg.color}18`, color: typeCfg.color, border: `1px solid ${typeCfg.color}30` }}
                    >
                      {typeCfg.icon}
                      {typeCfg.label}
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">#{i + 1}</span>
                  </div>

                  {/* Issue description */}
                  <p className="text-sm font-semibold text-red-300 mb-2">{description}</p>

                  {/* Fix suggestion */}
                  {suggestion && (
                    <div
                      className="rounded-lg p-3 mt-2"
                      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}
                    >
                      <p className="text-xs font-bold text-emerald-400 mb-1">💡 Fix</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{suggestion}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 5. 🚀 IMPROVEMENT SUGGESTIONS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-improvements"
        title="Improvement Suggestions"
        icon={<RiLightbulbLine size={16} />}
        color="#fbbf24"
        bg="rgba(245,158,11,0.12)"
        count={improvements?.length || 0}
      >
        {!improvements || improvements.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">Code is already well-optimized — no further suggestions.</p>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {improvements.map((imp: any, i: number) => {
              const suggestion = imp.suggestion || imp.suggested || imp.s || (typeof imp === 'string' ? imp : '');
              const impact     = imp.impact || '';

              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-300">{suggestion}</p>
                      {impact && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-bold text-amber-500">Impact:</span>
                          <p className="text-xs text-slate-300">{impact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 6. ⚠️ EDGE CASES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-edge-cases"
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
              <li key={i} className="flex items-start gap-3 text-sm">
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-xs font-bold"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
                >
                  {i + 1}
                </div>
                <span className="text-[var(--text-secondary)] leading-relaxed">{ec}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 7. 🧪 TEST CASES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section
        id="section-test-cases"
        title="Test Cases"
        icon={<RiTestTubeLine size={16} />}
        color="#a78bfa"
        bg="rgba(139,92,246,0.12)"
        count={test_cases.length}
        defaultOpen={false}
      >
        {test_cases.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">No test cases generated.</p>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {test_cases.map((tc: any, i: number) => {
              const catKey = String(tc.category || (i === 0 ? 'normal' : i <= 2 ? 'edge' : 'corner')).toLowerCase() as keyof typeof CATEGORY_CONFIG;
              const catCfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.normal;

              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-violet-400">Test {i + 1}</span>
                      {/* Category badge */}
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: catCfg.bg, color: catCfg.color }}
                      >
                        {catCfg.label}
                      </span>
                    </div>
                    <CopyBtn text={`Input: ${tc.input}\nExpected: ${tc.expected_output}`} />
                  </div>

                  {/* Body */}
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
                    {tc.description && (
                      <p className="text-xs text-slate-500 italic">📝 {tc.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 8. ⏱ TIME & SPACE COMPLEXITY */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {complexity && (complexity.time || complexity.space) && (
        <Section
          id="section-complexity"
          title="Time & Space Complexity"
          icon={<RiTimeLine size={16} />}
          color="#34d399"
          bg="rgba(16,185,129,0.12)"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complexity.time && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <RiTimeLine size={14} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Complexity</p>
                </div>
                <code className="text-sm font-mono text-emerald-400">{complexity.time}</code>
              </div>
            )}
            {complexity.space && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <RiDatabase2Line size={14} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Space Complexity</p>
                </div>
                <code className="text-sm font-mono text-emerald-400">{complexity.space}</code>
              </div>
            )}
          </div>
        </Section>
      )}
      </>
      )}

    </div>
  );
}
