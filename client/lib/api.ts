/**
 * Axios API Client
 * Pre-configured with base URL, auth headers, and error interceptors
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 60000, // 60s — generous for OpenAI calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired — clean up and redirect
    if (error.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup';

      if (!isAuthRoute) {
        // Clear stale auth data
        document.cookie = 'acr_token=; Max-Age=0; path=/';
        localStorage.removeItem('acr_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
