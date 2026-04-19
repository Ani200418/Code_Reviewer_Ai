'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  RiCodeSSlashLine, RiEyeLine, RiEyeOffLine,
  RiLoader4Line, RiCheckLine,
} from 'react-icons/ri';
import { useAuth } from '@/lib/context/AuthContext';
import { usePublicRoute } from '@/lib/hooks/useAuth';
import { extractErrorMessage } from '@/lib/utils';

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
}

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const { isLoading: authLoading } = usePublicRoute();

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  /* ── Google callback ──────────────────────────────────────────────────── */
  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      setIsGoogleLoading(true);
      try {
        await loginWithGoogle(response.credential);
        toast.success('Account created! Welcome aboard 🎉');
        router.push('/dashboard');
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const btn = document.getElementById('google-signup-btn');
      if (btn) {
        window.google?.accounts.id.renderButton(btn, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          width: btn.offsetWidth || 400,
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [handleGoogleCredential]);

  /* ── Form ─────────────────────────────────────────────────────────────── */
  const validate = () => {
    const errs: Partial<FormState> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!passwordRules.every((r) => r.test(form.password))) errs.password = 'Password does not meet requirements';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created! Welcome aboard 🎉');
      router.push('/dashboard');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 animate-spin"
             style={{ borderColor: 'rgba(168,85,247,0.3)', borderTopColor: '#a855f7' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                 style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(192,132,252,0.35)', boxShadow: '0 0 24px rgba(168,85,247,0.3)' }}>
              <RiCodeSSlashLine size={24} className="text-purple-400" />
            </div>
            <span className="font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              CodeReviewer<span className="grad-text">AI</span>
            </span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">

          {/* Google Sign-Up */}
          <div className="mb-5">
            <div
              id="google-signup-btn"
              className="w-full min-h-[44px] flex items-center justify-center rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(192,132,252,0.18)', background: 'rgba(255,255,255,0.04)' }}
            >
              {isGoogleLoading ? (
                <span className="flex items-center gap-2 text-sm py-2.5" style={{ color: 'var(--text-secondary)' }}>
                  <RiLoader4Line size={18} className="animate-spin" /> Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm py-2.5" style={{ color: 'var(--text-muted)' }}>
                  Loading Google Sign-Up…
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 divider" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or create with email</span>
            <div className="flex-1 divider" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" type="text" autoComplete="name" placeholder="Jane Doe"
                value={form.name} onChange={update('name')}
                className={`input ${errors.name ? 'input-error' : ''}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={update('email')}
                className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Create a strong password"
                  value={form.password} onChange={update('password')}
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {passwordRules.map((rule) => {
                    const passed = rule.test(form.password);
                    return (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-400' : ''}`}
                           style={!passed ? { color: 'var(--text-muted)' } : {}}>
                        <RiCheckLine size={12} className={passed ? 'opacity-100' : 'opacity-30'} />
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Repeat your password"
                  value={form.confirmPassword} onChange={update('confirmPassword')}
                  className={`input pr-11 ${errors.confirmPassword ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  {showConfirm ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
              {isSubmitting
                ? <><RiLoader4Line size={18} className="animate-spin" /> Creating account…</>
                : 'Create Account'}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium transition-colors hover:text-purple-300" style={{ color: '#c084fc' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
