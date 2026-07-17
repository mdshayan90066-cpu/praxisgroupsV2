import { useEffect, useState } from 'react';
import { Search, ClipboardList, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CompanyLayout from './CompanyLayout';
import { InternshipApplication } from '../lib/types';

const STATUSES = ['pending', 'accepted', 'rejected', 'interview_scheduled', 'completed'];

const statusColors: Record<string, string> = {
  pending: 'badge-gray', accepted: 'badge-green', rejected: 'badge-red',
  completed: 'badge-gold', interview_scheduled: 'badge-gold',
};

export default function CompanyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const { data: cu, error: cuErr } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cuErr) throw cuErr;
        if (!cu?.company_id) { setLoading(false); return; }

        const { data: interns, error: iErr } = await supabase
          .from('internships')
          .select('id')
          .eq('company_id', cu.company_id);
        if (iErr) throw iErr;

        const ids = (interns ?? []).map(i => i.id);
        if (ids.length === 0) { setApplications([]); setLoading(false); return; }

        const { data: apps, error: aErr } = await supabase
          .from('internship_applications')
          .select('*, internships(name, slug), students(full_name, email)')
          .in('internship_id', ids)
          .order('applied_at', { ascending: false });
        if (aErr) throw aErr;
        setApplications(apps ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from('internship_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: status as InternshipApplication['status'] } : a));
    setUpdating(null);
  };

  const filtered = applications.filter(a => {
    const student = a.students;
    const matchSearch = !search || student?.full_name?.toLowerCase().includes(search.toLowerCase()) || student?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <CompanyLayout><div className="max-w-5xl mx-auto space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-14 shimmer" />)}</div></CompanyLayout>;
  }

  if (error) {
    return <CompanyLayout><div className="max-w-5xl mx-auto"><div className="card text-center py-12"><p className="text-red-400 mb-4">{error}</p><button onClick={() => window.location.reload()} className="btn-secondary">Retry</button></div></div></CompanyLayout>;
  }

  return (
    <CompanyLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Applications</h1>
          <p className="text-gray-400 text-sm">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto text-sm">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="border border-dark-300 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{['Applicant', 'Internship', 'Applied', 'Status', 'Update Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-dark-600/30 transition-colors">
                    <td className="table-cell">
                      <div className="text-white text-sm">{app.students?.full_name}</div>
                      <div className="text-gray-500 text-xs flex items-center gap-1"><Mail size={10} />{app.students?.email}</div>
                    </td>
                    <td className="table-cell text-sm text-gray-300 max-w-xs"><div className="line-clamp-1">{app.internships?.name}</div></td>
                    <td className="table-cell text-xs text-gray-500">{new Date(app.applied_at).toLocaleDateString('en-IN')}</td>
                    <td className="table-cell"><span className={`badge ${statusColors[app.status] || 'badge-gray'}`}>{app.status.replace('_', ' ')}</span></td>
                    <td className="table-cell">
                      <select
                        value={app.status}
                        disabled={updating === app.id}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className="input py-1 text-xs w-full max-w-[150px]"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16">
            <ClipboardList size={40} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No applications found</h3>
            <p className="text-gray-500 text-sm">{search || statusFilter ? 'Try adjusting your filters.' : 'Applications will appear here once students apply.'}</p>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
