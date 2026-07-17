import { useEffect, useState } from 'react';
import { Users, Building2, BookOpen, Briefcase, Award, CreditCard, ClipboardList, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  students: number;
  companies: number;
  workshops: number;
  internships: number;
  certificates: number;
  payments: number;
  applications: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ students: 0, companies: 0, workshops: 0, internships: 0, certificates: 0, payments: 0, applications: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [sRes, coRes, wRes, iRes, certRes, payRes, waRes, iaRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('workshops').select('id', { count: 'exact', head: true }),
        supabase.from('internships').select('id', { count: 'exact', head: true }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'successful'),
        supabase.from('workshop_applications').select('id', { count: 'exact', head: true }),
        supabase.from('internship_applications').select('id', { count: 'exact', head: true }),
      ]);

      const revenue = (payRes.data ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      setStats({
        students: sRes.count ?? 0,
        companies: coRes.count ?? 0,
        workshops: wRes.count ?? 0,
        internships: iRes.count ?? 0,
        certificates: certRes.count ?? 0,
        payments: payRes.data?.length ?? 0,
        applications: (waRes.count ?? 0) + (iaRes.count ?? 0),
        revenue,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: Users, label: 'Total Students', value: stats.students, accent: 'primary' },
    { icon: Building2, label: 'Companies', value: stats.companies, accent: 'secondary' },
    { icon: BookOpen, label: 'Workshops', value: stats.workshops, accent: 'info' },
    { icon: Briefcase, label: 'Internships', value: stats.internships, accent: 'purple' },
    { icon: TrendingUp, label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, accent: 'success' },
    { icon: ClipboardList, label: 'Applications', value: stats.applications, accent: 'warning' },
    { icon: Award, label: 'Certificates Issued', value: stats.certificates, accent: 'primary' },
    { icon: CreditCard, label: 'Payments', value: stats.payments, accent: 'secondary' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Admin Dashboard</h1>
        <p className="text-[var(--text-secondary)] text-sm">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, accent }) => (
          <div
            key={label}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-[var(--color-${accent})]/10 flex items-center justify-center`}>
                <Icon size={18} className={`text-[var(--color-${accent})]`} style={{ color: `var(--color-${accent})` }} />
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {loading ? '—' : value}
            </div>
            <div className="text-[var(--text-muted)] text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentApplications />
        <RecentStudents />
      </div>
    </div>
  );
}

function RecentApplications() {
  const [apps, setApps] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('workshop_applications')
      .select('id, status, applied_at, workshops(name), students(full_name)')
      .order('applied_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setApps((data as Array<Record<string, unknown>>) ?? []); setLoading(false); });
  }, []);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-[var(--bg-interactive)] text-[var(--text-tertiary)]',
      accepted: 'bg-[var(--success-bg)] text-[var(--success-text)]',
      rejected: 'bg-[var(--error-bg)] text-[var(--error-text)]',
      completed: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]',
      payment_pending: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
      paid: 'bg-[var(--success-bg)] text-[var(--success-text)]',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
      <h2 className="text-[var(--text-primary)] font-semibold mb-5">Recent Applications</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      ) : apps.length > 0 ? (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id as string}
              className="flex items-center justify-between py-3 px-4 bg-[var(--bg-muted)] rounded-lg hover:bg-[var(--bg-interactive)] transition-colors"
            >
              <div>
                <div className="text-[var(--text-primary)] text-sm font-medium">{(app.students as { full_name: string })?.full_name}</div>
                <div className="text-[var(--text-muted)] text-xs">{(app.workshops as { name: string })?.name}</div>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full capitalize ${getStatusStyle(app.status as string)}`}>
                {String(app.status).replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-sm text-center py-8">No applications yet</p>
      )}
    </div>
  );
}

function RecentStudents() {
  const [students, setStudents] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('students')
      .select('id, full_name, email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setStudents((data as Array<Record<string, unknown>>) ?? []); setLoading(false); });
  }, []);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
      <h2 className="text-[var(--text-primary)] font-semibold mb-5">Recent Students</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      ) : students.length > 0 ? (
        <div className="space-y-3">
          {students.map((s) => (
            <div
              key={s.id as string}
              className="flex items-center justify-between py-3 px-4 bg-[var(--bg-muted)] rounded-lg hover:bg-[var(--bg-interactive)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary-muted)] flex items-center justify-center">
                  <span className="text-xs font-medium text-[var(--accent-primary)]">
                    {(s.full_name as string)?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="text-[var(--text-primary)] text-sm font-medium">{s.full_name as string}</div>
                  <div className="text-[var(--text-muted)] text-xs">{s.email as string}</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full capitalize ${
                s.status === 'active'
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                  : 'bg-[var(--error-bg)] text-[var(--error-text)]'
              }`}>
                {s.status as string}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-sm text-center py-8">No students yet</p>
      )}
    </div>
  );
}
