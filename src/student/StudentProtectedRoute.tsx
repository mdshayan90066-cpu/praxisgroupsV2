import { ReactNode, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../router';

export default function StudentProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'student') {
        navigate('/');
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'student') {
    return null;
  }

  return <>{children}</>;
}
