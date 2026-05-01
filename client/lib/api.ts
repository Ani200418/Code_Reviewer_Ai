/**
 * Axios API Client
 * Pre-configured with base URL, auth headers, and error interceptors
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 60000, // 60s — generous for AI API calls
  withCredentials: true, // Include credentials (cookies) with all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
// Reads the JWT token fresh from cookies on EVERY request.
// This eliminates the race condition where AuthContext's useEffect hasn't
// run yet when the first API call fires, causing a missing Authorization header.
api.interceptors.request.use(
  (config) => {
    // Read token from cookie on every call (works before AuthContext hydrates)
    const cookieToken = typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((row) => row.startsWith('acr_token='))
          ?.split('=')[1]
      : null;

    const token = cookieToken || (typeof window !== 'undefined'
      ? api.defaults.headers.common['Authorization']?.toString().replace('Bearer ', '')
      : null);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or invalid — clean up and redirect to login
    if (error.response?.status === 401) {
      const isAuthRoute =
        typeof window !== 'undefined' && (
          window.location.pathname === '/login' ||
          window.location.pathname === '/signup'
        );

      if (!isAuthRoute) {
        // Clear stale auth data
        if (typeof document !== 'undefined') {
          document.cookie = 'acr_token=; Max-Age=0; path=/';
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('acr_user');
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

