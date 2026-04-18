/**
 * Next.js Edge Middleware
 *
 * Runs BEFORE every request — before pages, before Next.js's own security
 * layer, before anything else.  This is the only 100% reliable place to
 * override response headers in Next.js 14 App Router.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * Google Sign-In uses a popup window. After the user authenticates, Google's
 * popup sends the credential back to the opener page via window.postMessage().
 * Browsers enforce Cross-Origin-Opener-Policy (COOP):
 *
 *   COOP: same-origin  →  blocks postMessage from cross-origin popup  ✗
 *   COOP: unsafe-none  →  allows postMessage from any popup            ✓
 *
 * Next.js 14 dev server sets COOP: same-origin on HTML responses by default.
 * next.config.js headers() is evaluated AFTER the dev-server's security layer
 * and can be silently overridden by it. Middleware runs FIRST and wins.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow Google OAuth popup → page communication via postMessage
  response.headers.set('Cross-Origin-Opener-Policy',   'unsafe-none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return response;
}

/**
 * Run on page routes only.
 * Exclude static assets, Next.js internals, and /api/* proxy calls
 * (those hit the Next.js rewrite engine before middleware).
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
};
