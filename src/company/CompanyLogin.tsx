import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import Logo from '../components/ui/Logo';
import PremiumBackground from '../components/ui/PremiumBackground';
import { Link, useNavigate } from '../router';
import { supabase } from '../lib/supabase';
import { getRoleFromUser } from '../lib/auth';

export default function CompanyLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err || !data.user) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    const role = getRoleFromUser(data.user);
    if (role !== 'company') {
      await supabase.auth.signOut();
      setError('This account is not registered as a company. Please use the correct login portal.');
      setLoading(false);
      return;
    }

    navigate('/company/dashboard');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'rgba(10,10,10,0.82)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <PremiumBackground />
        <div className="relative z-10 max-w-sm text-center">
          <Logo size="lg" className="justify-center mb-10" />
          <h2 className="text-3xl font-bold text-white mb-4">Partner Portal</h2>
          <p className="text-[rgba(255,255,255,0.55)] leading-relaxed mb-8">
            Manage your internship listings, review applications, and connect with talented students.
          </p>
          <div className="space-y-3">
            {['Post internships', 'Review applications', 'Connect with talent'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-left">
                <div className="w-1.5 h-1.5 bg-[#C89A4B] rounded-full shrink-0" />
                <span className="text-[rgba(255,255,255,0.5)] text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="md" linkTo="/" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} className="text-gold-500" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Sign In</h1>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              Looking for workshops?{' '}
              <Link to="/login" className="text-[var(--accent-primary)] hover:underline transition-colors">
                Student login
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Company Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="hr@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--accent-primary)] hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[var(--accent-on)]/40 border-t-[var(--accent-on)] rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--surface-border)] text-center">
            <p className="text-[var(--text-muted)] text-xs">
              Want to partner with us?{' '}
              <Link to="/for-companies" className="text-[var(--accent-primary)] hover:underline">Apply here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
