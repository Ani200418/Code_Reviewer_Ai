import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center text-center p-6">
      <div>
        <div className="text-7xl font-bold text-sky-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
