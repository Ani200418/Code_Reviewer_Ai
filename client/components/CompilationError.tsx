'use client';

import { RiAlertLine, RiCodeLine } from 'react-icons/ri';

interface CompilationErrorProps {
  error: string;
  language?: string;
  fileName?: string;
  code?: string;
  suggestion?: string;
}

export default function CompilationError({
  error,
  language = 'javascript',
  fileName,
  code,
  suggestion,
}: CompilationErrorProps) {
  // Try to extract line number from error message
  const lineMatch = error.match(/line (\d+)|at (\d+)|:(\d+)/i);
  const lineNumber = lineMatch ? lineMatch[1] || lineMatch[2] || lineMatch[3] : null;

  // Extract error type
  const errorTypeMatch = error.match(/(\w+Error):/);
  const errorType = errorTypeMatch ? errorTypeMatch[1] : 'Compilation Error';

  // Get the code lines if available
  const codeLines = code ? code.split('\n') : [];
  const highlightLine = lineNumber ? parseInt(lineNumber) - 1 : null;

  return (
    <div className="space-y-4">
      {/* Error Header */}
      <div className="card-glow p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <RiAlertLine size={24} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-400">{errorType}</h2>
            <p className="text-slate-300 text-sm mt-1">{error}</p>
            {suggestion && (
              <p className="text-slate-400 text-sm mt-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
                💡 <strong>Suggestion:</strong> {suggestion}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Code Context */}
      {code && codeLines.length > 0 && (
        <div className="card-glow p-5">
          <div className="flex items-center gap-2 mb-3">
            <RiCodeLine size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">
              {fileName ? `${fileName} • ` : ''}
              {language.toUpperCase()}
            </span>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-700/50">
            <div className="bg-[#0d1117] overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <tbody>
                  {codeLines.map((line, idx) => {
                    const isErrorLine = highlightLine === idx;
                    const lineNum = idx + 1;

                    return (
                      <tr
                        key={idx}
                        className={`${
                          isErrorLine ? 'bg-red-500/10 border-l-2 border-red-500' : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="text-right pr-4 py-2 text-slate-600 select-none w-12">
                          <span className={isErrorLine ? 'text-red-400 font-bold' : ''}>
                            {lineNum}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-300 whitespace-pre-wrap break-all">
                          {line}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {highlightLine !== null && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-300">
                ⚠️ Error likely at <strong>line {highlightLine + 1}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.1)' }}>
        <p className="text-xs text-slate-400">
          <strong>💡 Tip:</strong> Check the highlighted line for syntax issues. Common mistakes:
          missing semicolons, unmatched brackets/parentheses, incorrect indentation, or missing keywords.
        </p>
      </div>
    </div>
  );
}
