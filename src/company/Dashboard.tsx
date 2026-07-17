import { useEffect, useState } from 'react';
import { Briefcase, ClipboardList, Clock, Building2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../router';
import CompanyLayout from './CompanyLayout';
import { Internship, InternshipApplication, Company } from '../lib/types';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // 1. Get company_id from company_users
        const { data: cu, error: cuErr } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cuErr) throw cuErr;
        if (!cu?.company_id) { setLoading(false); return; }

        // 2. Fetch company, internships, and applications in parallel
        const [coRes, iRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', cu.company_id).maybeSingle(),
          supabase.from('internships').select('*').eq('company_id', cu.company_id).order('created_at', { ascending: false }),
        ]);
        if (coRes.error) throw coRes.error;
        if (iRes.error) throw iRes.error;
        setCompany(coRes.data);
        setInternships(iRes.data ?? []);

        // 3. Fetch applications for those internships
        if ((iRes.data ?? []).length > 0) {
          const ids = (iRes.data ?? []).map(i => i.id);
          const { data: apps, error: aErr } = await supabase
            .from('internship_applications')
            .select('*, internships(name, slug), students(full_name, email)')
            .in('internship_id', ids)
            .order('applied_at', { ascending: false });
          if (aErr) throw aErr;
          setApplications(apps ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = company?.status === 'approved' ? 1 : 0;

  const stats = [
    { icon: Briefcase, label: 'Posted Internships', value: internships.length, color: 'text-gold-500', bg: 'bg-gold-600/10 border-gold-600/20', to: '/company/internships' },
    { icon: ClipboardList, label: 'Total Applications', value: applications.length, color: 'text-forest-400', bg: 'bg-forest-600/10 border-forest-600/20', to: '/company/applications' },
    { icon: Clock, label: 'Pending Applications', value: pendingCount, color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20', to: '/company/applications' },
    { icon: Building2, label: 'Approved Companies', value: approvedCount, color: 'text-gold-500', bg: 'bg-gold-600/10 border-gold-600/20', to: '/company/profile' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'badge-gray', accepted: 'badge-green', rejected: 'badge-red',
    completed: 'badge-gold', interview_scheduled: 'badge-gold',
  };

  if (loading) {
    return <CompanyLayout><div className="max-w-5xl mx-auto space-y-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 shimmer" />)}</div><div className="h-64 shimmer" /></div></CompanyLayout>;
  }

  if (error) {
    return <CompanyLayout><div className="max-w-5xl mx-auto"><div className="card text-center py-12"><p className="text-red-400 mb-4">{error}</p><button onClick={() => window.location.reload()} className="btn-secondary">Retry</button></div></div></CompanyLayout>;
  }

  return (
    <CompanyLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{company?.name || 'Company'} Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage your internships and applications.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value, color, bg, to }) => (
            <button key={label} onClick={() => navigate(to)} className="stat-card hover:border-gold-600/40 transition-colors text-left">
              <div className={`w-10 h-10 ${bg} border flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </button>
          ))}
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Recent Applications</h2>
            <button onClick={() => navigate('/company/applications')} className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-dark-300 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm font-medium truncate">{app.students?.full_name}</div>
                    <div className="text-gray-500 text-xs truncate">{app.internships?.name}</div>
                  </div>
                  <span className={`badge ${statusColors[app.status] || 'badge-gray'} ml-3`}>{app.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No applications yet</p>
            </div>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
}
