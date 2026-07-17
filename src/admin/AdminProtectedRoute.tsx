import { ReactNode } from 'react';
import { useAdminAuth } from './AdminAuth';
import AdminLogin from './AdminLogin';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <>{children}</>;
}
