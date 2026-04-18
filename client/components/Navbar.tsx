'use client';

import Link from 'next/link';
import { RiCodeSSlashLine, RiArrowRightLine } from 'react-icons/ri';
import { useAuth } from '@/lib/context/AuthContext';

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="border-b border-[rgba(168,85,247,0.10)] backdrop-blur-sm sticky top-0 z-50 bg-surface-900/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <RiCodeSSlashLine size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            CodeReviewer<span className="text-purple-400">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Dashboard <RiArrowRightLine size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get Started <RiArrowRightLine size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
