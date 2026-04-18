'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  RiFileCopyLine, RiCheckLine, RiDeleteBin6Line,
  RiCodeSSlashLine, RiMagicLine,
} from 'react-icons/ri';
import { LANGUAGE_OPTIONS, LanguageValue, getMonacoLanguage } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const THEMES = [
  { id: 'vs-dark',     label: 'VS Dark'  },
  { id: 'dracula',     label: 'Dracula'  },
  { id: 'night-owl',   label: 'Night Owl'},
] as const;

// Language detection patterns
const DETECT_PATTERNS: { lang: LanguageValue; patterns: RegExp[] }[] = [
  { lang: 'python',     patterns: [/^def\s+\w+/, /^import\s+\w+/, /^from\s+\w+\s+import/, /print\(/, /:\s*$/m] },
  { lang: 'java',       patterns: [/public\s+class\s+\w+/, /System\.out\.print/, /import\s+java\./, /void\s+main/] },
  { lang: 'typescript', patterns: [/:\s*(string|number|boolean|any)\b/, /interface\s+\w+/, /type\s+\w+\s*=/, /<\w+>/, /as\s+\w+/] },
  { lang: 'cpp',        patterns: [/#include\s*</, /std::/, /cout\s*<</, /int\s+main\s*\(/] },
  { lang: 'go',         patterns: [/^package\s+\w+/, /^func\s+\w+/, /fmt\.Print/, /:=\s/] },
  { lang: 'rust',       patterns: [/^fn\s+\w+/, /let\s+mut\s+/, /println!\(/, /^use\s+\w+::/, /impl\s+\w+/] },
  { lang: 'javascript', patterns: [/^(const|let|var)\s+/, /=>\s*{/, /console\.(log|error)/, /require\(/, /module\.exports/] },
];

function detectLanguage(code: string): LanguageValue {
  const scores: Record<string, number> = {};
  for (const { lang, patterns } of DETECT_PATTERNS) {
    scores[lang] = patterns.filter((p) => p.test(code)).length;
  }
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (sorted[0][1] > 0) return sorted[0][0] as LanguageValue;
  return 'javascript';
}

interface CodeEditorProps {
  code: string;
  language: LanguageValue;
  onChange: (code: string) => void;
  onLanguageChange: (lang: LanguageValue) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  height?: string;
}

export default function CodeEditor({
  code, language, onChange, onLanguageChange, onSubmit, disabled, height = '380px',
}: CodeEditorProps) {
  const [theme, setTheme] = useState<string>('vs-dark');
  const [copied, setCopied] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const editorRef = useRef<unknown>(null);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoDetect = useCallback(() => {
    if (!code.trim()) return;
    const lang = detectLanguage(code);
    onLanguageChange(lang);
    const label = LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label;
    setDetected(label || lang);
    setTimeout(() => setDetected(null), 2500);
  }, [code, onLanguageChange]);

  // Ctrl/Cmd+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !disabled && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onSubmit]);

  const langLabel = LANGUAGE_OPTIONS.find((l) => l.value === language)?.label ?? language;

  return (
    <div className="rounded-2xl overflow-hidden border border-[rgba(192,132,252,0.12)]" style={{ background: '#110d1e' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(17,13,30,0.95)', borderBottom: '1px solid rgba(192,132,252,0.10)' }}
      >
        {/* Left: dots + lang */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#f87171' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#fbbf24' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#34d399' }} />
          </div>
          <div className="flex items-center gap-1.5">
            <RiCodeSSlashLine size={13} className="text-purple-400" />
            <span className="text-xs text-[var(--text-secondary)] font-mono">{langLabel}</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Auto-detect */}
          <button
            onClick={handleAutoDetect}
            disabled={disabled || !code.trim()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: detected ? '#34d399' : '#64748b', background: detected ? 'rgba(16,185,129,0.1)' : 'transparent' }}
            title="Auto-detect language"
          >
            <RiMagicLine size={13} />
            {detected ? `Detected: ${detected}` : 'Auto-detect'}
          </button>

          {/* Theme selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-all"
            style={{ background: 'rgba(29,18,53,0.7)', color: 'var(--text-muted)', border: '1px solid rgba(192,132,252,0.14)' }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={!code}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: copied ? '#34d399' : '#475569' }}
            title="Copy code"
          >
            {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
          </button>

          {/* Clear */}
          <button
            onClick={() => onChange('')}
            disabled={disabled || !code}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
            title="Clear code"
          >
            <RiDeleteBin6Line size={14} />
          </button>
        </div>
      </div>

      {/* Language tabs */}
      <div
        className="flex items-center gap-1 px-4 py-2 overflow-x-auto"
        style={{ background: 'rgba(17,13,30,0.75)', borderBottom: '1px solid rgba(192,132,252,0.07)' }}
      >
        {LANGUAGE_OPTIONS.filter((l) => l.value !== 'other').map((lang) => (
          <button
            key={lang.value}
            onClick={() => onLanguageChange(lang.value as LanguageValue)}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition-all"
            style={{
              background: language === lang.value ? 'rgba(168,85,247,0.15)' : 'transparent',
              color: language === lang.value ? '#c084fc' : '#475569',
              border: language === lang.value ? '1px solid rgba(192,132,252,0.32)' : '1px solid transparent',
            }}
          >
            {lang.label}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0 text-xs text-[var(--text-muted)] pl-4">
          ⌘ + Enter to analyze
        </div>
      </div>

      {/* Monaco */}
      <MonacoEditor
        height={height}
        language={getMonacoLanguage(language)}
        value={code}
        theme={theme}
        onChange={(val) => onChange(val ?? '')}
        onMount={(editor) => { editorRef.current = editor; }}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme('dracula', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { background: '282a36' },
              { token: 'comment', foreground: '6272a4' },
              { token: 'keyword', foreground: 'ff79c6' },
              { token: 'string', foreground: 'f1fa8c' },
              { token: 'number', foreground: 'bd93f9' },
            ],
            colors: {
              'editor.background': '#282a36',
              'editor.foreground': '#f8f8f2',
            }
          });
          monaco.editor.defineTheme('night-owl', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { background: '011627' },
              { token: 'comment', foreground: '637777', fontStyle: 'italic' },
              { token: 'keyword', foreground: 'c792ea', fontStyle: 'italic' },
              { token: 'string', foreground: 'ecc48d' },
              { token: 'number', foreground: 'f78c6c' },
            ],
            colors: {
              'editor.background': '#011627',
              'editor.foreground': '#d6deeb',
            }
          });
        }}
        options={{
          fontSize: 13.5,
          fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorStyle: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          scrollbar: { vertical: 'auto', horizontal: 'hidden', verticalScrollbarSize: 5 },
          readOnly: disabled,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          suggest: { showKeywords: true },
        }}
      />

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(17,13,30,0.95)', borderTop: '1px solid rgba(192,132,252,0.07)' }}
      >
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {code.split('\n').length} lines · {code.length} chars
        </span>
        <span className="text-xs text-[var(--text-muted)]">UTF-8</span>
      </div>
    </div>
  );
}
