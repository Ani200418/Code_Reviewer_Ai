'use client';

import Link from 'next/link';
import { RiCodeSSlashLine, RiGithubFill, RiLinkedinBoxFill, RiHeartFill } from 'react-icons/ri';

interface FooterProps {
  variant?: 'full' | 'minimal';
}

export default function Footer({ variant = 'minimal' }: FooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className="mt-auto py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span>Built with</span>
            <RiHeartFill size={13} className="text-red-500/70 animate-pulse" />
            <span>by</span>
            <a
              href="https://github.com/Ani200418"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-sky-400 font-semibold transition-colors duration-200"
            >
              Aniket Singh
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Ani200418"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-400 transition-colors"
              title="GitHub"
            >
              <RiGithubFill size={17} />
            </a>
            <a
              href="https://linkedin.com/in/aniketsingh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-sky-400 transition-colors"
              title="LinkedIn"
            >
              <RiLinkedinBoxFill size={17} />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[rgba(56,189,248,0.07)] mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                <RiCodeSSlashLine size={16} className="text-sky-400" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                CodeReviewer<span className="text-sky-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered code analysis for modern developers. Catch bugs, optimize performance, and ship with confidence.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Product</p>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-slate-500 hover:text-sky-400 transition-colors">Dashboard</Link>
                <Link href="/dashboard/review" className="block text-slate-500 hover:text-sky-400 transition-colors">New Review</Link>
                <Link href="/dashboard/history" className="block text-slate-500 hover:text-sky-400 transition-colors">History</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Creator</p>
              <div className="space-y-2">
                <a href="https://github.com/Ani200418" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                  <RiGithubFill size={14} /> GitHub
                </a>
                <a href="https://linkedin.com/in/aniketsingh" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-slate-500 hover:text-sky-400 transition-colors">
                  <RiLinkedinBoxFill size={14} /> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} CodeReviewerAI · All rights reserved
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span>Crafted with</span>
            <RiHeartFill size={13} className="text-red-500/70" />
            <span>by</span>
            <a
              href="https://github.com/Ani200418"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-400 hover:text-sky-400 transition-colors"
            >
              Aniket Singh
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
