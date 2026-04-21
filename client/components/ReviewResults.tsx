'use client';

import { useState } from 'react';
import {
  RiBugLine, RiLightbulbLine, RiInformationLine,
  RiTestTubeLine, RiAlertLine, RiFileCopyLine, RiCheckLine,
} from 'react-icons/ri';
import { AIResponse } from '@/lib/services';
import ScoreDisplay from './ScoreDisplay';
import CompilationError from './CompilationError';

interface ReviewResultsProps {
  result: AIResponse | any;  // Can be AIResponse or CompilationError response
  processingTime?: number;
}

const SectionCard = ({
  title, icon, count, color, children, defaultOpen = true,
}: {
  title: string; icon: React.ReactNode; count?: number;
  color: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={color}>{icon}</span>
          <span className="font-semibold text-slate-200">{title}</span>
          {count !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              count === 0
                ? 'bg-surface-600 text-slate-500'
                : 'bg-sky-500/15 text-sky-400'
            }`}>
              {count}
            </span>
          )}
        </div>
        <span className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-[rgba(56,189,248,0.08)] p-5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-surface-600 text-slate-500 hover:text-slate-300 transition-colors"
      title="Copy"
    >
      {copied ? <RiCheckLine size={14} className="text-green-400" /> : <RiFileCopyLine size={14} />}
    </button>
  );
};

export default function ReviewResults({ result, processingTime }: ReviewResultsProps) {
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

  return (
    <div className="space-y-4">
      {/* Processing time badge */}
      {processingTime && (
        <div className="flex justify-end">
          <span className="text-xs text-slate-500">
            Analysis completed in {(processingTime / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      {/* Score */}
      <ScoreDisplay score={result.score} />

      {/* Explanation */}
      <SectionCard
        title="Code Explanation"
        icon={<RiInformationLine size={20} />}
        color="text-sky-400"
      >
        <p className="text-slate-300 leading-relaxed text-sm">{result.explanation}</p>
      </SectionCard>

      {/* Issues */}
      <SectionCard
        title="Issues Found"
        icon={<RiBugLine size={20} />}
        color="text-red-400"
        count={result.issues?.length || 0}
      >
        {!result.issues || result.issues.length === 0 ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <RiCheckLine size={16} />
            <span>No issues detected. Excellent code!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {result.issues.map((issue: any, i: number) => {
              // Handle string fallback for old cached data, or object fields
              const isString = typeof issue === 'string';
              const severity = isString ? 'medium' : (issue.severity || 'medium');
              const description = isString ? issue : (issue.description || issue.issue || 'Unknown issue');
              const type = isString ? 'bug' : (issue.type || 'bug');
              const suggestion = isString ? '' : (issue.suggestion || issue.explanation || '');
              
              return (
                <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
                        style={{
                          background: severity === 'high' ? 'rgba(239,68,68,0.2)' : severity === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
                          color: severity === 'high' ? '#f87171' : severity === 'medium' ? '#fbbf24' : '#38bdf8'
                        }}
                      >
                        {String(severity).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-red-300 font-medium text-sm">{description}</p>
                        <p className="text-xs text-slate-500 mt-1">Type: {type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-20">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Fix:</p>
                    <p className="text-slate-400 text-sm">{suggestion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Improvements */}
      <SectionCard
        title="Improvement Suggestions"
        icon={<RiLightbulbLine size={20} />}
        color="text-amber-400"
        count={result.improvements?.length || 0}
      >
        {!result.improvements || result.improvements.length === 0 ? (
          <p className="text-slate-400 text-sm">Code is already well-optimized.</p>
        ) : (
          <div className="space-y-4">
            {result.improvements.map((imp: any, i: number) => {
              // Handle string fallback for old cached data, or object fields
              const isString = typeof imp === 'string';
              const area = isString ? 'general' : (imp.area || 'general');
              const suggestion = isString ? imp : (imp.suggested || imp.suggestion || '');
              const current = isString ? '' : (imp.current || '');
              const impact = isString ? '' : (imp.impact || '');
              
              return (
                <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-amber-300 font-medium text-sm mb-2">
                    {String(area).charAt(0).toUpperCase() + String(area).slice(1)}: {suggestion}
                  </p>
                  {current && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500">Current:</span>
                        <p className="text-slate-400 mt-0.5">{current}</p>
                      </div>
                    </div>
                  )}
                  {impact && (
                    <div className="text-xs">
                      <span className="text-amber-400 font-medium">Impact:</span>
                      <p className="text-slate-400">{impact}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Edge Cases */}
      <SectionCard
        title="Edge Cases"
        icon={<RiAlertLine size={20} />}
        color="text-orange-400"
        count={result.edge_cases.length}
        defaultOpen={false}
      >
        {result.edge_cases.length === 0 ? (
          <p className="text-slate-400 text-sm">No notable edge cases identified.</p>
        ) : (
          <ul className="space-y-2">
            {result.edge_cases.map((ec: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <RiAlertLine size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                {ec}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Test Cases */}
      <SectionCard
        title="Test Cases"
        icon={<RiTestTubeLine size={20} />}
        color="text-violet-400"
        count={result.test_cases.length}
        defaultOpen={false}
      >
        {result.test_cases.length === 0 ? (
          <p className="text-slate-400 text-sm">No test cases generated.</p>
        ) : (
          <div className="space-y-3">
            {result.test_cases.map((tc: any, i: number) => (
              <div key={i} className="bg-violet-500/5 border border-violet-500/20 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/15">
                  <span className="text-xs font-semibold text-violet-400">Test Case {i + 1}</span>
                  <CopyButton text={`Input: ${tc.input}\nExpected: ${tc.expected_output}`} />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Input</p>
                    <code className="text-xs text-slate-300 font-mono bg-surface-700 px-2 py-1 rounded block whitespace-pre-wrap">
                      {tc.input}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Expected Output</p>
                    <code className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-1 rounded block whitespace-pre-wrap">
                      {tc.expected_output}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
