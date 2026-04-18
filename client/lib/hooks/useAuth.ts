'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * useProtectedRoute
 * Redirects unauthenticated users to /login
 * Use inside pages that require authentication
 */
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}

/**
 * usePublicRoute
 * Redirects authenticated users away from login/signup to dashboard
 */
export function usePublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}
