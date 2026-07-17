import { useEffect, useState } from 'react';
import { Briefcase, Users, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from '../router';
import CompanyLayout from './CompanyLayout';
import { Internship } from '../lib/types';

interface InternshipWithCount extends Internship {
  application_count?: number;
}

export default function CompanyInternships() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<InternshipWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .select('*')
          .eq('company_id', cu.company_id)
          .order('created_at', { ascending: false });
        if (iErr) throw iErr;

        // Fetch application counts per internship
        const list = interns ?? [];
        if (list.length > 0) {
          const ids = list.map(i => i.id);
          const { data: counts, error: cErr } = await supabase
            .from('internship_applications')
            .select('internship_id')
            .in('internship_id', ids);
          if (cErr) throw cErr;
          const countMap: Record<string, number> = {};
          (counts ?? []).forEach(c => { countMap[c.internship_id] = (countMap[c.internship_id] || 0) + 1; });
          setInternships(list.map(i => ({ ...i, application_count: countMap[i.id] || 0 })));
        } else {
          setInternships([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load internships');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const statusColors: Record<string, string> = {
    draft: 'badge-gray', open: 'badge-green', closed: 'badge-red', archived: 'badge-gray',
  };

  if (loading) {
    return <CompanyLayout><div className="max-w-5xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 shimmer" />)}</div></CompanyLayout>;
  }

  if (error) {
    return <CompanyLayout><div className="max-w-5xl mx-auto"><div className="card text-center py-12"><p className="text-red-400 mb-4">{error}</p><button onClick={() => window.location.reload()} className="btn-secondary">Retry</button></div></div></CompanyLayout>;
  }

  return (
    <CompanyLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Internships</h1>
            <p className="text-gray-400 text-sm">{internships.length} internship{internships.length !== 1 ? 's' : ''} posted</p>
          </div>
        </div>

        {internships.length > 0 ? (
          <div className="space-y-4">
            {internships.map((intern) => (
              <div key={intern.id} className="card hover:border-gold-600/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-dark-600 border border-dark-300 flex items-center justify-center shrink-0">
                      <Briefcase size={20} className="text-gold-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{intern.name}</h3>
                        <span className={`badge ${statusColors[intern.status] || 'badge-gray'}`}>{intern.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{intern.domain || 'No domain'}</span>
                        <span>{intern.work_mode}</span>
                        <span>{intern.duration || 'Flexible'}</span>
                        {intern.stipend_type === 'paid' && <span className="text-forest-400">{intern.stipend_amount} {intern.stipend_currency}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-gold-500 font-bold text-lg">
                        <Users size={15} />
                        {intern.application_count || 0}
                      </div>
                      <div className="text-gray-500 text-xs">Applicants</div>
                    </div>
                    <button
                      onClick={() => navigate('/company/applications')}
                      className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                    >
                      View <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Briefcase size={40} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No internships posted yet</h3>
            <p className="text-gray-500 text-sm mb-6">Post your first internship to start receiving applications.</p>
            <Link to="/for-companies" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              <Plus size={16} /> Post an Internship
            </Link>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
