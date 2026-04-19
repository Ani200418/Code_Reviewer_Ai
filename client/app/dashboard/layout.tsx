'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RiCodeSSlashLine, RiDashboardLine, RiHistoryLine,
  RiMenuLine, RiLogoutBoxLine, RiUserLine,
  RiHeartFill, RiGithubFill,
} from 'react-icons/ri';
import { useAuth } from '@/lib/context/AuthContext';
import { useProtectedRoute } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/dashboard',         label: 'Dashboard', icon: <RiDashboardLine size={16} /> },
  { href: '/dashboard/review',  label: 'New Review', icon: <RiCodeSSlashLine size={16} /> },
  { href: '/dashboard/history', label: 'History',    icon: <RiHistoryLine size={16} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isLoading } = useProtectedRoute();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(13,17,23,0.95)', borderRight: '1px solid rgba(168,85,247,0.08)', backdropFilter: 'blur(20px)' }}
      >
        {/* Brand */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(168,85,247,0.07)' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <RiCodeSSlashLine size={16} className="text-purple-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">CodeReviewer<span className="text-purple-400">AI</span></span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`nav-pill ${active ? 'active' : ''}`}>
                <span className={active ? 'text-purple-400' : 'text-slate-600'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(168,85,247,0.07)' }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1" style={{ background: 'rgba(30,41,59,0.5)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <RiUserLine size={13} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="nav-pill w-full text-red-500/70 hover:text-red-400 hover:bg-red-500/08 mt-1">
            <RiLogoutBoxLine size={14} /> Sign Out
          </button>
          {/* Branding */}
          <div className="mt-3 pt-3 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid rgba(168,85,247,0.05)' }}>
            <span className="text-xs text-slate-700">by</span>
            <a href="https://github.com/aniketsingh" target="_blank" rel="noopener noreferrer"
               className="text-xs font-medium text-slate-600 hover:text-purple-400 transition-colors">Aniket Singh</a>
            <RiGithubFill size={12} className="text-slate-700" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
                style={{ background: 'rgba(13,17,23,0.9)', borderBottom: '1px solid rgba(168,85,247,0.08)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
            <RiMenuLine size={19} />
          </button>
          <span className="font-bold text-sm text-white">CodeReviewer<span className="text-purple-400">AI</span></span>
        </header>

        <main className="flex-1 p-4 lg:p-8 page-enter overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <div className="px-6 py-4 text-center" style={{ borderTop: '1px solid rgba(168,85,247,0.05)' }}>
          <p className="text-xs text-slate-700 flex items-center justify-center gap-1.5">
            Built with <RiHeartFill size={11} className="text-red-500/60" /> by
            <a href="https://github.com/aniketsingh" target="_blank" rel="noopener noreferrer"
               className="font-semibold text-slate-600 hover:text-purple-400 transition-colors">Aniket Singh</a>
          </p>
        </div>
      </div>
    </div>
  );
}
