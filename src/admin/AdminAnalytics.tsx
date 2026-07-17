import { useEffect, useState } from 'react';
import { TrendingUp, Users, BookOpen, Briefcase, Award, CreditCard, Activity, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  students: number;
  activeStudents: number;
  companies: number;
  approvedCompanies: number;
  workshops: number;
  activeWorkshops: number;
  internships: number;
  openInternships: number;
  workshopApps: number;
  internshipApps: number;
  certificates: number;
  revenue: number;
  payments: number;
  workshopAppsByStatus: Record<string, number>;
  internshipAppsByStatus: Record<string, number>;
  studentsByMonth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
}

const empty: AnalyticsData = {
  students: 0, activeStudents: 0, companies: 0, approvedCompanies: 0,
  workshops: 0, activeWorkshops: 0, internships: 0, openInternships: 0,
  workshopApps: 0, internshipApps: 0, certificates: 0, revenue: 0, payments: 0,
  workshopAppsByStatus: {}, internshipAppsByStatus: {},
  studentsByMonth: [], revenueByMonth: [],
};

function monthKey(d: string) {
  const date = new Date(d);
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [sRes, coRes, wRes, iRes, waRes, iaRes, certRes, payRes] = await Promise.all([
        supabase.from('students').select('id, status, created_at'),
        supabase.from('companies').select('id, status'),
        supabase.from('workshops').select('id, status'),
        supabase.from('internships').select('id, status'),
        supabase.from('workshop_applications').select('id, status, applied_at'),
        supabase.from('internship_applications').select('id, status, applied_at'),
        supabase.from('certificates').select('id, status'),
        supabase.from('payments').select('id, amount, status, created_at'),
      ]);

      const students = sRes.data ?? [];
      const companies = coRes.data ?? [];
      const workshops = wRes.data ?? [];
      const internships = iRes.data ?? [];
      const workshopApps = waRes.data ?? [];
      const internshipApps = iaRes.data ?? [];
      const certs = certRes.data ?? [];
      const payments = payRes.data ?? [];

      const waByStatus: Record<string, number> = {};
      workshopApps.forEach(a => { waByStatus[a.status] = (waByStatus[a.status] ?? 0) + 1; });

      const iaByStatus: Record<string, number> = {};
      internshipApps.forEach(a => { iaByStatus[a.status] = (iaByStatus[a.status] ?? 0) + 1; });

      // Students by month (last 6 months)
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }));
      }
      const sByMonth: Record<string, number> = {};
      months.forEach(m => sByMonth[m] = 0);
      students.forEach(s => {
        const mk = monthKey(s.created_at);
        if (mk in sByMonth) sByMonth[mk]++;
      });

      const revByMonth: Record<string, number> = {};
      months.forEach(m => revByMonth[m] = 0);
      payments.filter(p => p.status === 'successful').forEach(p => {
        const mk = monthKey(p.created_at);
        if (mk in revByMonth) revByMonth[mk] += Number(p.amount);
      });

      setData({
        students: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        companies: companies.length,
        approvedCompanies: companies.filter(c => c.status === 'approved').length,
        workshops: workshops.length,
        activeWorkshops: workshops.filter(w => w.status === 'active').length,
        internships: internships.length,
        openInternships: internships.filter(i => i.status === 'open').length,
        workshopApps: workshopApps.length,
        internshipApps: internshipApps.length,
        certificates: certs.length,
        revenue: payments.filter(p => p.status === 'successful').reduce((s, p) => s + Number(p.amount), 0),
        payments: payments.length,
        workshopAppsByStatus: waByStatus,
        internshipAppsByStatus: iaByStatus,
        studentsByMonth: months.map(m => ({ month: m, count: sByMonth[m] })),
        revenueByMonth: months.map(m => ({ month: m, amount: revByMonth[m] })),
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const cards = [
    { icon: Users, label: 'Students', value: `${data.activeStudents}/${data.students}`, sub: 'active / total', color: 'text-gold-500', bg: 'bg-gold-600/10 border-gold-600/20' },
    { icon: Briefcase, label: 'Companies', value: `${data.approvedCompanies}/${data.companies}`, sub: 'approved / total', color: 'text-forest-400', bg: 'bg-forest-600/10 border-forest-600/20' },
    { icon: BookOpen, label: 'Workshops', value: `${data.activeWorkshops}/${data.workshops}`, sub: 'active / total', color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-600/20' },
    { icon: Briefcase, label: 'Internships', value: `${data.openInternships}/${data.internships}`, sub: 'open / total', color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-600/20' },
    { icon: Activity, label: 'Applications', value: data.workshopApps + data.internshipApps, sub: 'workshop + internship', color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-600/20' },
    { icon: Award, label: 'Certificates', value: data.certificates, sub: 'issued', color: 'text-gold-500', bg: 'bg-gold-600/10 border-gold-600/20' },
    { icon: CreditCard, label: 'Payments', value: data.payments, sub: 'transactions', color: 'text-forest-400', bg: 'bg-forest-600/10 border-forest-600/20' },
    { icon: TrendingUp, label: 'Revenue', value: `₹${data.revenue.toLocaleString()}`, sub: 'total collected', color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
  ];

  const maxStudents = Math.max(...data.studentsByMonth.map(m => m.count), 1);
  const maxRevenue = Math.max(...data.revenueByMonth.map(m => m.amount), 1);

  const statusBadge: Record<string, string> = {
    pending: 'badge-gray', accepted: 'badge-green', rejected: 'badge-red',
    completed: 'badge-gold', payment_pending: 'badge-red', paid: 'badge-green', interview_scheduled: 'badge-gold',
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-gray-400 text-sm">Platform growth metrics and engagement insights.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className="stat-card">
              <div className={`w-10 h-10 ${bg} border flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : value}</div>
              <div className="text-gray-500 text-xs">{label} · <span className="text-gray-600">{sub}</span></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student growth chart */}
          <div className="card">
            <h2 className="text-white font-semibold mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-gold-500" /> Student Signups (6 months)</h2>
            {loading ? (
              <div className="h-40 shimmer" />
            ) : (
              <div className="flex items-end justify-between gap-3 h-40">
                {data.studentsByMonth.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gold-600/20 border border-gold-600/30 transition-all hover:bg-gold-600/30" style={{ height: `${(m.count / maxStudents) * 100}%`, minHeight: '4px' }} />
                    <span className="text-gray-400 text-xs">{m.count}</span>
                    <span className="text-gray-600 text-xs">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue chart */}
          <div className="card">
            <h2 className="text-white font-semibold mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-green-400" /> Revenue (6 months)</h2>
            {loading ? (
              <div className="h-40 shimmer" />
            ) : (
              <div className="flex items-end justify-between gap-3 h-40">
                {data.revenueByMonth.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-green-600/20 border border-green-600/30 transition-all hover:bg-green-600/30" style={{ height: `${(m.amount / maxRevenue) * 100}%`, minHeight: '4px' }} />
                    <span className="text-gray-400 text-xs">₹{m.amount >= 1000 ? `${(m.amount / 1000).toFixed(1)}k` : m.amount}</span>
                    <span className="text-gray-600 text-xs">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workshop app status breakdown */}
          <div className="card">
            <h2 className="text-white font-semibold mb-5">Workshop Applications by Status</h2>
            {Object.keys(data.workshopAppsByStatus).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No workshop applications yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.workshopAppsByStatus).map(([status, count]) => {
                  const pct = data.workshopApps > 0 ? (count / data.workshopApps) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`badge ${statusBadge[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>
                        <span className="text-gray-400 text-sm">{count} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-dark-600">
                        <div className="h-full bg-gold-600/50" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internship app status breakdown */}
          <div className="card">
            <h2 className="text-white font-semibold mb-5">Internship Applications by Status</h2>
            {Object.keys(data.internshipAppsByStatus).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No internship applications yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.internshipAppsByStatus).map(([status, count]) => {
                  const pct = data.internshipApps > 0 ? (count / data.internshipApps) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`badge ${statusBadge[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>
                        <span className="text-gray-400 text-sm">{count} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-dark-600">
                        <div className="h-full bg-forest-600/50" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
