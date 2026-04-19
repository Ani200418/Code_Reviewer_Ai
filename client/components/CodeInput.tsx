'use client';

import { RiCloseCircleLine } from 'react-icons/ri';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CodeInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter input (one line per argument, or JSON for complex types)...',
}: CodeInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-300">
          Code Input (Optional)
        </label>
        <button
          onClick={() => onChange('')}
          disabled={disabled || !value}
          className="text-xs text-slate-500 hover:text-slate-400 disabled:opacity-50 transition-colors"
        >
          <RiCloseCircleLine size={14} />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full h-24 px-4 py-3 rounded-xl text-sm font-mono text-slate-300 placeholder-slate-600 resize-none transition-all outline-none"
        style={{
          background: 'rgba(30,41,59,0.5)',
          border: '1px solid rgba(148,163,184,0.1)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
          e.currentTarget.style.background = 'rgba(15,23,42,0.8)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)';
          e.currentTarget.style.background = 'rgba(30,41,59,0.5)';
        }}
      />
      <p className="text-xs text-slate-500">
        💡 Tip: For JavaScript/Python, enter arguments separated by newlines. For input to stdin, enter as raw text.
      </p>
    </div>
  );
}
