import { supabase } from './supabase';

export type UserRole = 'student' | 'admin' | 'company' | null;

export async function getUserRole(): Promise<UserRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return (user.app_metadata?.role as UserRole) ?? null;
}

export function getRoleFromUser(user: { app_metadata?: Record<string, unknown> } | null): UserRole {
  if (!user) return null;
  return (user.app_metadata?.role as UserRole) ?? null;
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error?.message ?? null };
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}
