import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    }
    // On success the auth listener swaps this page out; leave the button disabled.
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-dashboard-bg px-4">
      <div className="w-full max-w-sm bg-panel-white border border-border-color shadow-md p-8">
        <h1 className="font-heading text-2xl text-text-primary mb-1">TurfSheet</h1>
        <p className="text-sm text-text-secondary mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="border border-border-color px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-turf-green"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="border border-border-color px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-turf-green"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-turf-green hover:bg-turf-green-dark disabled:opacity-60 text-white font-medium py-2 transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
