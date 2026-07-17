import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Student } from '../lib/types';
import { getRoleFromUser, UserRole } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  student: Student | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching student:', error.message);
      setStudent(null);
      return;
    }
    setStudent(data);
  }, []);

  const refreshStudent = useCallback(async () => {
    if (user) await fetchStudent(user.id);
  }, [user, fetchStudent]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(getRoleFromUser(session?.user ?? null));
      if (session?.user) {
        fetchStudent(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(getRoleFromUser(session?.user ?? null));
      if (session?.user) {
        (async () => {
          await fetchStudent(session.user.id);
        })();
      } else {
        setStudent(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      const { error: insertError } = await supabase.from('students').insert({
        user_id: data.user.id,
        full_name: fullName,
        email,
      });
      if (insertError) {
        console.error('Error creating student record:', insertError.message);
      }
    }
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStudent(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, student, role, loading, signIn, signUp, signOut, refreshStudent }),
    [user, session, student, role, loading, signIn, signUp, signOut, refreshStudent]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
