'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL error parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'access-denied') {
      setError('Access denied. You do not have admin privileges.');
    }
  }, [searchParams]);

  // Redirect if already authenticated and admin
  useEffect(() => {
    if (user && isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // signIn function already handles redirect on success
    } catch (err: any) {
      // Generic error message for all login failures
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 sm:text-sm"
            placeholder="admin@sutr.store"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 sm:text-sm"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-black px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent"></div>
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
