// Language icon component - emoji-based

const ICONS: Record<string, string> = {
  javascript: '🟨',
  typescript: '🔷',
  python: '🐍',
  java: '☕',
  cpp: '⚙️',
  go: '🔵',
  rust: '🦀',
  other: '📄',
};

interface LanguageIconProps {
  language: string;
  className?: string;
}

export default function LanguageIcon({ language, className = '' }: LanguageIconProps) {
  return (
    <div
      className={`w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-lg ${className}`}
    >
      {ICONS[language] ?? '📄'}
    </div>
  );
}
