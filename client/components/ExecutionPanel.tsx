'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { RiPlayCircleLine, RiErrorWarningLine, RiCheckLine, RiFileCopyLine } from 'react-icons/ri';
import { reviewService, ExecutionOutput } from '@/lib/services';
import { extractErrorMessage } from '@/lib/utils';

interface ExecutionPanelProps {
  code: string;
  language: string;
  userInput: string;
  disabled?: boolean;
}

export default function ExecutionPanel({
  code,
  language,
  userInput,
  disabled = false,
}: ExecutionPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<(ExecutionOutput & { processingTime: number }) | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setIsRunning(true);
    setResult(null);
    try {
      const res = await reviewService.runCode(code, language, userInput || undefined);
      setResult(res);
      setShowOutput(true);
      if (res.success) {
        toast.success('Code executed successfully!');
      } else {
        toast.error('Code execution failed');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-3">
      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={disabled || isRunning || !code.trim()}
        className="w-full px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600/20"
        style={{
          background: 'rgba(34,197,94,0.1)',
          color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.3)',
        }}
      >
        {isRunning ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-green-400/30 border-t-green-400 animate-spin" />
            Running code...
          </>
        ) : (
          <>
            <RiPlayCircleLine size={16} />
            Run Code (No Analysis)
          </>
        )}
      </button>

      {/* Output Section */}
      {result && showOutput && (
        <div
          className="rounded-xl overflow-hidden border transition-all"
          style={{
            background: 'rgba(15,23,42,0.6)',
            borderColor: result.success
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: result.success
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(239,68,68,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <RiCheckLine size={16} style={{ color: '#22c55e' }} />
              ) : (
                <RiErrorWarningLine size={16} style={{ color: '#ef4444' }} />
              )}
              <span className="font-medium text-sm" style={{ color: result.success ? '#22c55e' : '#ef4444' }}>
                {result.success ? 'Execution Successful' : 'Execution Failed'}
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                {result.processingTime}ms
              </span>
            </div>
          </div>

          {/* Output */}
          {result.output && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Output</span>
                <button
                  onClick={() => copyToClipboard(result.output)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <RiFileCopyLine size={12} />
                </button>
              </div>
              <pre
                className="text-xs font-mono text-slate-300 whitespace-pre-wrap word-break overflow-auto max-h-40"
                style={{ color: '#cbd5e1' }}
              >
                {result.output}
              </pre>
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-400 uppercase">Error</span>
                <button
                  onClick={() => copyToClipboard(result.error || '')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <RiFileCopyLine size={12} />
                </button>
              </div>
              <pre
                className="text-xs font-mono text-red-300 whitespace-pre-wrap word-break overflow-auto max-h-40"
                style={{ color: '#fca5a5' }}
              >
                {result.error}
              </pre>
            </div>
          )}

          {/* No Output */}
          {!result.output && !result.error && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 italic">No output produced</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
