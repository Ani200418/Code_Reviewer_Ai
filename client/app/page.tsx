import Link from 'next/link';
import {
  RiCodeSSlashLine, RiShieldCheckLine, RiLineChartLine,
  RiTestTubeLine, RiArrowRightLine, RiStarFill,
  RiGithubFill, RiLinkedinBoxFill, RiHeartFill,
} from 'react-icons/ri';

const features = [
  { icon: <RiShieldCheckLine size={20} />, title: 'Bug Detection',    desc: 'GPT-4 finds logical bugs, null references, race conditions, and security vulnerabilities before they reach production.',           color: '#f87171', bg: 'rgba(239,68,68,0.10)' },
  { icon: <RiLineChartLine  size={20} />, title: 'Optimization',      desc: 'Get actionable performance improvements with estimated impact on speed, memory, and maintainability.',                             color: '#fbbf24', bg: 'rgba(245,158,11,0.10)' },
  { icon: <RiCodeSSlashLine size={20} />, title: 'Code Explanation',   desc: 'Understand what any code does — explained in plain English, perfect for onboarding or code review.',                              color: '#c084fc', bg: 'rgba(168,85,247,0.10)' },
  { icon: <RiTestTubeLine   size={20} />, title: 'Test Generation',    desc: 'Automatically generate edge-case-aware test cases to improve coverage and catch regressions.',                                   color: '#f472b6', bg: 'rgba(236,72,153,0.10)' },
];

const stats = [
  { val: '7+',    label: 'Languages'     },
  { val: 'GPT-4', label: 'Powered by'    },
  { val: '< 30s', label: 'Analysis time' },
  { val: '0–100', label: 'Quality score' },
];

const langs = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust'];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid rgba(192,132,252,0.1)', backdropFilter: 'blur(20px)', background: 'rgba(11,8,20,0.8)' }}
           className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(192,132,252,0.28)' }}>
              <RiCodeSSlashLine size={17} className="text-purple-400" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              CodeReviewer<span className="grad-text">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"  className="btn-ghost text-sm px-4 py-2">Sign In</Link>
            <Link href="/signup" className="btn-gradient text-sm px-5 py-2.5">
              Get Started Free <RiArrowRightLine size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
             style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(192,132,252,0.25)', color: '#c084fc' }}>
          <RiStarFill size={11} /> Powered by GPT-4o · Built by Aniket Singh
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.05]" style={{ color: 'var(--text-primary)' }}>
          AI-Powered<br />
          <span className="grad-text">Code Review</span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Paste your code and receive instant feedback on bugs, performance, and quality —
          powered by GPT-4. Ship better code, faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link href="/signup" className="btn-gradient text-base px-8 py-3.5 justify-center">
            Start Reviewing Free <RiArrowRightLine size={17} />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3.5 justify-center">
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-14">
          {stats.map((s) => (
            <div key={s.label} className="glass p-4 text-center">
              <div className="text-2xl font-bold grad-text">{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Lang strip */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Supports:</span>
          {langs.map((l) => <span key={l} className="badge-sky text-xs">{l}</span>)}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="section-label">What You Get</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Everything to ship better code
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass-hover p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                <span style={{ color: f.color }}>{f.icon}</span>
              </div>
              <h3 className="font-bold mb-2 text-base" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Score preview ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grad-border p-px rounded-2xl">
          <div className="rounded-2xl p-8 md:p-12 text-center" style={{ background: 'var(--bg-card)' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Quality Score at a Glance
            </h2>
            <p className="mb-10 text-sm" style={{ color: 'var(--text-muted)' }}>
              Every review includes a detailed breakdown across 4 dimensions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[['Overall','82','#10b981'],['Readability','76','#c084fc'],['Efficiency','88','#10b981'],['Best Practices','71','#f59e0b']].map(([l,s,c]) => (
                <div key={l} className="glass p-5 text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: c as string }}>{s}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{l}</div>
                  <div className="score-track">
                    <div className="score-fill" style={{ width:`${s}%`, background: c as string }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Ready to write better code?
        </h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Join developers using AI-powered review to ship faster and safer.
        </p>
        <Link href="/signup" className="btn-gradient text-base px-10 py-4 justify-center inline-flex">
          Get Started — It&apos;s Free <RiArrowRightLine size={17} />
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(192,132,252,0.09)' }} className="mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'rgba(168,85,247,0.1)' }}>
              <RiCodeSSlashLine size={13} className="text-purple-400" />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} CodeReviewerAI
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Built with <RiHeartFill size={12} className="text-pink-500/70" /> by
            <a href="https://github.com/aniketsingh" target="_blank" rel="noopener noreferrer"
               className="font-semibold hover:text-purple-400 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Aniket Singh
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/aniketsingh" target="_blank" rel="noopener noreferrer"
               className="hover:text-slate-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <RiGithubFill size={16} />
            </a>
            <a href="https://linkedin.com/in/aniketsingh" target="_blank" rel="noopener noreferrer"
               className="hover:text-purple-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <RiLinkedinBoxFill size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
