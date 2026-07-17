import { useState, useEffect } from 'react';
import { Save, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';

export default function StudentProfile() {
  const { student, refreshStudent } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', college: '', degree: '', graduation_year: '', skills: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        full_name: student.full_name || '',
        phone: student.phone || '',
        college: student.college || '',
        degree: student.degree || '',
        graduation_year: student.graduation_year?.toString() || '',
        skills: student.skills?.join(', ') || '',
      });
    }
  }, [student]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setLoading(true);
    await supabase.from('students').update({
      full_name: form.full_name,
      phone: form.phone,
      college: form.college,
      degree: form.degree,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).eq('id', student.id);
    await refreshStudent();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  };

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-gray-400 text-sm">Keep your profile updated to improve your chances with internship applications.</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-dark-300">
            <div className="w-16 h-16 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center">
              <User size={28} className="text-gold-500" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">{student?.full_name}</div>
              <div className="text-gray-400 text-sm">{student?.email}</div>
              <div className="badge badge-gold mt-1">Student</div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">College / University</label>
              <input className="input" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Degree / Program</label>
                <input className="input" placeholder="e.g. B.Tech Computer Science" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
              </div>
              <div>
                <label className="label">Graduation Year</label>
                <input className="input" type="number" min={2000} max={2035} placeholder="e.g. 2025" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Skills (comma-separated)</label>
              <input className="input" placeholder="e.g. Python, Excel, Marketing, Figma" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            </div>

            {success && <div className="px-4 py-3 bg-forest-600/10 border border-forest-600/30 text-forest-400 text-sm">Profile updated successfully!</div>}

            <button type="submit" disabled={loading} className="btn-primary px-6 py-3 flex items-center gap-2">
              <Save size={15} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
}
