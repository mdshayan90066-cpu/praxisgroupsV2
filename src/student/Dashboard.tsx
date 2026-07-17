import { useEffect, useState } from 'react';
import { BookOpen, Briefcase, Award, CreditCard, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';
import { useNavigate } from '../router';
import { WorkshopApplication, InternshipApplication, Certificate } from '../lib/types';

export default function StudentDashboard() {
  const { student } = useAuth();
  const navigate = useNavigate();
  const [workshopApps, setWorkshopApps] = useState<WorkshopApplication[]>([]);
  const [internshipApps, setInternshipApps] = useState<InternshipApplication[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wRes, iRes, cRes] = await Promise.all([
          supabase.from('workshop_applications').select('*, workshops(name, slug, thumbnail_url, commencement_date)').eq('student_id', student.id).order('applied_at', { ascending: false }).limit(5),
          supabase.from('internship_applications').select('*, internships(name, slug, partner_company_name)').eq('student_id', student.id).order('applied_at', { ascending: false }).limit(5),
          supabase.from('certificates').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(5),
        ]);
        setWorkshopApps(wRes.data ?? []);
        setInternshipApps(iRes.data ?? []);
        setCertificates(cRes.data ?? []);
      } catch (err) {
        console.error("Dashboard metric resolution failure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student]);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-[var(--bg-interactive)] text-[var(--text-tertiary)]',
      accepted: 'bg-[var(--success-bg)] text-[var(--success-text)]',
      rejected: 'bg-[var(--error-bg)] text-[var(--error-text)]',
      completed: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]',
      payment_pending: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
      paid: 'bg-[var(--success-bg)] text-[var(--success-text)]',
      interview_scheduled: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]',
    };
    return styles[status] || styles.pending;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = student?.full_name ? String(student.full_name).split(' ')[0] : 'Student';

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            {greeting}, {displayName}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Here's an overview of your learning journey.</p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: 'Workshops', value: workshopApps.length, accent: 'primary' as const, to: '/student/workshops' },
            { icon: Briefcase, label: 'Internships', value: internshipApps.length, accent: 'secondary' as const, to: '/student/internships' },
            { icon: Award, label: 'Certificates', value: certificates.length, accent: 'primary' as const, to: '/student/certificates' },
            { icon: CreditCard, label: 'Pending Dues', value: workshopApps.filter(a => a.payment_status === 'pending').length, accent: 'error' as const, to: '/student/payments' },
          ].map(({ icon: Icon, label, value, accent, to }) => {
            const accentStyle =
              accent === 'error'
                ? { background: 'var(--error-bg)', color: 'var(--error-text)' }
                : accent === 'secondary'
                ? { background: 'var(--success-bg)', color: 'var(--success-text)' }
                : { background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' };
            return (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3`} style={accentStyle}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{loading ? '—' : value}</div>
              <div className="text-[var(--text-muted)] text-xs mt-1">{label}</div>
            </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workshops Widget Box */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[var(--text-primary)] font-semibold text-sm">My Workshops</h2>
              <button onClick={() => navigate('/student/workshops')} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-[var(--bg-muted)] animate-pulse" />)}
              </div>
            ) : workshopApps.length > 0 ? (
              <div className="space-y-3">
                {workshopApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-3 px-4 bg-[var(--bg-muted)] rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="text-[var(--text-primary)] text-sm font-medium truncate">{(app as unknown as { workshops?: { name?: string } }).workshops?.name}</div>
                      <div className="text-[var(--text-muted)] text-xs">{new Date(app.applied_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full capitalize ml-3 ${getStatusStyle(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted)] text-sm mb-4">No workshop enrollments yet</p>
                <button onClick={() => navigate('/workshops')} className="px-4 py-2 border border-[var(--card-border)] bg-[var(--bg-muted)] text-xs rounded-lg hover:bg-[var(--bg-interactive)] transition-all">
                  Browse Workshops
                </button>
              </div>
            )}
          </div>

          {/* Internships Widget Box */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[var(--text-primary)] font-semibold text-sm">My Internships</h2>
              <button onClick={() => navigate('/student/internships')} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-[var(--bg-muted)] animate-pulse" />)}
              </div>
            ) : internshipApps.length > 0 ? (
              <div className="space-y-3">
                {internshipApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-3 px-4 bg-[var(--bg-muted)] rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="text-[var(--text-primary)] text-sm font-medium truncate">{(app as unknown as { internships?: { name?: string; partner_company_name?: string } }).internships?.name}</div>
                      <div className="text-[var(--text-muted)] text-xs">{(app as unknown as { internships?: { name?: string; partner_company_name?: string } }).internships?.partner_company_name}</div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full capitalize ml-3 ${getStatusStyle(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted)] text-sm mb-4">No internship applications yet</p>
                <button onClick={() => navigate('/internships')} className="px-4 py-2 border border-[var(--card-border)] bg-[var(--bg-muted)] text-xs rounded-lg hover:bg-[var(--bg-interactive)] transition-all">
                  Browse Internships
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
