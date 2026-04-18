'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  authProvider?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'acr_token';
const USER_KEY  = 'acr_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedToken = Cookies.get(TOKEN_KEY);
      const savedUser  = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistAuth = (tkn: string, usr: User) => {
    Cookies.set(TOKEN_KEY, tkn, { expires: 7, sameSite: 'strict' });
    localStorage.setItem(USER_KEY, JSON.stringify(usr));
    api.defaults.headers.common['Authorization'] = `Bearer ${tkn}`;
    setToken(tkn);
    setUser(usr);
  };

  const clearAuth = () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    persistAuth(res.data.token, res.data.user);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    persistAuth(res.data.token, res.data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/signup', { name, email, password });
    persistAuth(res.data.token, res.data.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithGoogle,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
