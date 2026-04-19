'use client';

import { RiFileCopyLine, RiCheckLine } from 'react-icons/ri';
import { useState } from 'react';

interface ExecutionOutputProps {
  output: string;
  error: string | null;
  success: boolean;
}

export default function ExecutionOutput({
  output,
  error,
  success,
}: ExecutionOutputProps) {
  const [copied, setCopied] = useState(false);

  if (!output && !error) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output || error || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-300">
          Actual Output
          {success && <span className="ml-2 text-xs text-green-400">(Executed)</span>}
          {!success && error && <span className="ml-2 text-xs text-red-400">(Error)</span>}
        </label>
        <button
          onClick={handleCopy}
          disabled={!output && !error}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: copied ? '#34d399' : '#475569' }}
          title={copied ? 'Copied!' : 'Copy output'}
        >
          {copied ? <RiCheckLine size={13} /> : <RiFileCopyLine size={13} />}
        </button>
      </div>
      <code
        className="block text-xs font-mono p-4 rounded-xl whitespace-pre-wrap break-all max-h-40 overflow-y-auto"
        style={{
          background: error && !success ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
          border: `1px solid ${error && !success ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
          color: error && !success ? '#fca5a5' : '#86efac',
        }}
      >
        {error && !success ? error : output || '(No output)'}
      </code>
      {!success && !error && (
        <p className="text-xs text-slate-500">
          ℹ️ Direct execution is not supported for this language in this environment.
        </p>
      )}
    </div>
  );
}
