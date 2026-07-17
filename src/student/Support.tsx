import { useEffect, useState } from 'react';
import { HelpCircle, AlertCircle, Plus, MessageSquare, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  open: 'badge-gold', in_progress: 'badge-gray', resolved: 'badge-green', closed: 'badge-gray',
};
const priorityColors: Record<string, string> = {
  low: 'badge-gray', medium: 'badge-gold', high: 'badge-red',
};

export default function Support() {
  const { student } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!student) return;
    const { data, error } = await supabase.from('support_tickets').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
    if (error) setError(error.message);
    else { setTickets(data ?? []); setError(null); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      student_id: student.id,
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: 'open',
    });
    if (error) setError(error.message);
    else {
      setForm({ subject: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchTickets();
    }
    setSubmitting(false);
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Support</h1>
            <p className="text-gray-400 text-sm">Get help with your account, workshops, or payments.</p>
          </div>
          {!showForm && tickets.length > 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
              <Plus size={15} /> New Ticket
            </button>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2"><MessageSquare size={16} className="text-gold-500" /> New Support Ticket</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Briefly describe your issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[120px] resize-y" placeholder="Provide details about your issue..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 shimmer" />)}</div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="card hover:border-gold-600/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm mb-1">{t.subject}</div>
                    <p className="text-gray-400 text-sm line-clamp-2">{t.description}</p>
                    <div className="text-gray-500 text-xs mt-2">Opened: {new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`badge ${statusColors[t.status] || 'badge-gray'}`}>{t.status.replace(/_/g, ' ')}</span>
                    <span className={`badge ${priorityColors[t.priority] || 'badge-gray'}`}>{t.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !showForm ? (
          <div className="card text-center py-16">
            <HelpCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Support Tickets</h3>
            <p className="text-gray-500 text-sm mb-4">Need help? Create a support ticket and our team will get back to you.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 mx-auto">
              <Plus size={15} /> Create Ticket
            </button>
          </div>
        ) : null}
      </div>
    </StudentLayout>
  );
}
