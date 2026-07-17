import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import CompanyLogin from './CompanyLogin';

export default function CompanyProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'company') {
    return <CompanyLogin />;
  }

  return <>{children}</>;
}
