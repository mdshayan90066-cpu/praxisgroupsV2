import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, XCircle, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';

interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  workshop_id: string | null;
  internship_id: string | null;
  workshops?: { name: string } | null;
  internships?: { name: string } | null;
}

const statusMeta: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  present: { color: 'badge-green', icon: CheckCircle2 },
  absent: { color: 'badge-red', icon: XCircle },
  late: { color: 'badge-gold', icon: Clock },
};

export default function Attendance() {
  const { student } = useAuth();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    supabase
      .from('attendance')
      .select('*, workshops(name), internships(name)')
      .eq('student_id', student.id)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRecords(data ?? []);
        setLoading(false);
      });
  }, [student]);

  const present = records.filter(r => r.status === 'present').length;
  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Attendance</h1>
          <p className="text-gray-400 text-sm">Your attendance records across workshops and internships.</p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Sessions', value: records.length, color: 'text-white' },
              { label: 'Present', value: present, color: 'text-forest-400' },
              { label: 'Attendance Rate', value: `${rate}%`, color: 'text-gold-500' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-14 shimmer" />)}</div>
        ) : records.length > 0 ? (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr>{['Date', 'Program', 'Status', 'Notes'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const meta = statusMeta[r.status] || statusMeta.present;
                    const StatusIcon = meta.icon;
                    const program = r.workshops?.name || r.internships?.name || '—';
                    return (
                      <tr key={r.id} className="hover:bg-dark-600/30 transition-colors">
                        <td className="table-cell text-sm text-gray-300">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="table-cell text-sm text-white">{program}</td>
                        <td className="table-cell"><span className={`badge ${meta.color} flex items-center gap-1 w-fit`}><StatusIcon size={10} /> {r.status}</span></td>
                        <td className="table-cell text-xs text-gray-500">{r.notes ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-16">
            <CalendarClock size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Attendance Records</h3>
            <p className="text-gray-500 text-sm">Your attendance will be tracked once you start attending workshop or internship sessions.</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
