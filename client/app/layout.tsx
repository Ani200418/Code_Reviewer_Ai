import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeReviewerAI — AI-Powered Code Analysis',
  description: 'Instantly analyze your code for bugs, optimizations, and quality scores. Built by Aniket Singh.',
  keywords: ['code review', 'AI', 'bug detection', 'GPT-4', 'developer tool'],
  authors: [{ name: 'Aniket Singh' }],
  openGraph: {
    title: 'CodeReviewerAI',
    description: 'AI-powered code analysis: bugs, optimizations, and quality scores.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#160f28",
                color: '#e2e8f0',
                border: "1px solid rgba(192,132,252,0.2)",
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                backdropFilter: 'blur(20px)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#160f28' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#160f28' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
