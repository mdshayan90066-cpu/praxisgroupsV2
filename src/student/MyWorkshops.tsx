import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';
import { useNavigate } from '../router';
import { WorkshopApplication } from '../lib/types';

export default function MyWorkshops() {
  const { student } = useAuth();
  const navigate = useNavigate();
  const [workshopApps, setWorkshopApps] = useState<WorkshopApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) return;
    const fetchWorkshops = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('workshop_applications')
          .select('*, workshops(name, slug, description, commencement_date)')
          .eq('student_id', student.id)
          .order('applied_at', { ascending: false });
        setWorkshopApps(data ?? []);
      } catch (err) {
        console.error("Error loading workshops data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshops();
  }, [student]);

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">My Workshops</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Manage and track your premium course registrations.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {/* Standard static array loop blocks */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse opacity-40" />
            ))}
          </div>
        ) : workshopApps.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {workshopApps.map((app) => (
              <div key={app.id} className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{(app as unknown as { workshops?: { name?: string } }).workshops?.name || 'Workshop'}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Applied: {new Date(app.applied_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-[var(--bg-interactive)] text-[var(--text-tertiary)] capitalize">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl max-w-xl mx-auto mt-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-interactive)] flex items-center justify-center mb-4 border border-[var(--surface-border)]">
              <BookOpen size={24} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-semibold text-base">No Workshop Records Found</h3>
            <p className="text-[var(--text-muted)] text-xs max-w-sm mt-1 mb-6">
              You haven't enrolled or registered for any educational workshops yet. Explore our premier programs to elevate your skillsets.
            </p>
            <button onClick={() => navigate('/workshops')} className="px-5 py-2.5 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-xl transition-all shadow-md">
              Browse Available Workshops
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
