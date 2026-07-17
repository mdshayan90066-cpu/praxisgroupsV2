import { useEffect, useState } from 'react';
import { ClipboardList, AlertCircle, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  workshop_id: string | null;
  internship_id: string | null;
  due_date: string | null;
  max_marks: number | null;
  created_at: string;
  workshops?: { name: string } | null;
  internships?: { name: string } | null;
  assignment_submissions?: { status: string; marks: number | null; submitted_at: string | null }[];
}

const subStatusMeta: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  submitted: { color: 'badge-gold', icon: Clock },
  graded: { color: 'badge-green', icon: CheckCircle2 },
  late: { color: 'badge-red', icon: XCircle },
  pending: { color: 'badge-gray', icon: Clock },
};

export default function Assignments() {
  const { student } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    (async () => {
      // 1. Get enrolled workshop IDs and internship IDs
      const [wRes, iRes] = await Promise.all([
        supabase.from('workshop_applications').select('workshop_id').eq('student_id', student.id).in('status', ['accepted', 'completed', 'paid']),
        supabase.from('internship_applications').select('internship_id').eq('student_id', student.id).in('status', ['accepted', 'completed']),
      ]);
      if (wRes.error || iRes.error) { setError(wRes.error?.message || iRes.error?.message || 'Failed to load'); setLoading(false); return; }

      const wIds = (wRes.data ?? []).map(r => r.workshop_id);
      const iIds = (iRes.data ?? []).map(r => r.internship_id);

      if (wIds.length === 0 && iIds.length === 0) { setAssignments([]); setLoading(false); return; }

      // 2. Fetch assignments matching those IDs, with program names and the student's submissions
      let query = supabase.from('assignments').select('*, workshops(name), internships(name), assignment_submissions!left(status, marks, submitted_at)').eq('assignment_submissions.student_id', student.id);
      if (wIds.length > 0 && iIds.length > 0) {
        query = query.or(`workshop_id.in.(${wIds.join(',')}),internship_id.in.(${iIds.join(',')})`);
      } else if (wIds.length > 0) {
        query = query.in('workshop_id', wIds);
      } else {
        query = query.in('internship_id', iIds);
      }

      const { data, error: aErr } = await query.order('due_date', { ascending: true });
      if (aErr) setError(aErr.message);
      else setAssignments((data ?? []) as Assignment[]);
      setLoading(false);
    })();
  }, [student]);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Assignments</h1>
          <p className="text-gray-400 text-sm">View assignments from your enrolled workshops and internships.</p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 shimmer" />)}</div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((a) => {
              const sub = a.assignment_submissions?.[0];
              const subStatus = sub?.status ?? 'pending';
              const meta = subStatusMeta[subStatus] || subStatusMeta.pending;
              const SubIcon = meta.icon;
              const programName = a.workshops?.name || a.internships?.name || 'General';
              const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
              return (
                <div key={a.id} className="card hover:border-gold-600/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm mb-1">{a.title}</div>
                      <div className="text-gray-500 text-xs mb-2">{programName}</div>
                      {a.description && <p className="text-gray-400 text-sm line-clamp-2">{a.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                        {a.due_date && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                            <Calendar size={11} /> Due: {new Date(a.due_date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                        {a.max_marks && <span>Max: {a.max_marks} marks</span>}
                        {sub?.marks != null && <span className="text-gold-500">Scored: {sub.marks}</span>}
                      </div>
                    </div>
                    <span className={`badge ${meta.color} flex items-center gap-1 shrink-0`}>
                      <SubIcon size={10} /> {subStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 text-sm">Assignments from your enrolled workshops and internships will appear here.</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
