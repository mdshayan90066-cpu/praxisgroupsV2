import { useState, FormEvent } from 'react';
import { Shield } from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useAdminAuth } from './AdminAuth';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await login(email, password);
    setSubmitting(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" linkTo="" />
          <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-primary-muted)] rounded-full">
            <Shield size={12} className="text-[var(--accent-primary)]" />
            <span className="text-[var(--accent-primary)] text-xs font-semibold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="label" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-[var(--error-text)] text-sm">{error}</p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
