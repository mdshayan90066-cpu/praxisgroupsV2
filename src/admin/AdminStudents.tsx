import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Shield, ShieldCheck, Search } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const studentList = (data || []).filter((p: Profile) => p.role === 'student' || p.role === 'user');
        
        setStudents(studentList);
        setFilteredStudents(studentList);
      } catch (err) {
        console.error("Critical student resolution failure:", err);
        setError(err instanceof Error ? err.message : "An unexpected table matching error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = [...students];
    if (search.trim() !== '') {
      result = result.filter(s => 
        (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredStudents(result);
  }, [search, students]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Top Title Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-[var(--accent-primary)]" />
            Students Management
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {filteredStudents.length} total registered platform learners.
          </p>
        </div>
      </div>

      {/* Search Toolbar Row */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      {/* Global Error Notice Fallback Banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <Shield size={16} className="shrink-0" />
          <div>
            <p className="font-semibold">Local Environment Mismatch Detected</p>
            <p className="opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Grid / Data Display View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--card-bg)] animate-pulse opacity-40" />
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <div className="divide-y divide-[var(--card-border)]">
              {filteredStudents.map((studentItem) => (
                <div key={studentItem.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-interactive)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs uppercase shrink-0">
                      {studentItem.full_name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{studentItem.full_name || 'Student Learner'}</h4>
                      <p className="text-gray-400 text-xs truncate flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {studentItem.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck size={10} /> Active Profile
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
      ) : (
        /* Premium Professional Empty Placeholder Layout */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl max-w-xl mx-auto mt-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-interactive)] border border-[var(--card-border)] flex items-center justify-center mb-4">
            <Users size={24} className="text-gray-500" />
          </div>
          <h3 className="text-white font-semibold text-base">No Students Found</h3>
          <p className="text-gray-400 text-xs max-w-sm mt-1">
            There are no student accounts registered in your live application system database lines at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
