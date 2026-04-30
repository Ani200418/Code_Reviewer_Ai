/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  // Monaco editor requires this
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },

  // ── Reverse proxy ────────────────────────────────────────────────────────
  // All /api/* requests from the browser go to Next.js (same-origin),
  // which forwards them to Express on port 5000 server-side.
  // This eliminates CORS entirely — the browser never makes a cross-origin call.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // ── Security headers ─────────────────────────────────────────────────────
  // Next.js 14 App Router sets Cross-Origin-Opener-Policy: same-origin by default.
  // This blocks window.postMessage from Google's OAuth popup → Google Sign-In breaks.
  // Setting unsafe-none on both the opener (our page) and embedder allows Google
  // Sign-In popups to communicate credentials back via postMessage.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
