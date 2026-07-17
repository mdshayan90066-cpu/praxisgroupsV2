import { useEffect, useState } from 'react';
import { Send, Mail, Users, Building2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Audience = 'all_students' | 'active_students' | 'all_companies' | 'approved_companies' | 'custom';

interface EmailLog {
  id: string;
  subject: string;
  body: string;
  audience: string;
  recipient_count: number;
  status: string;
  created_at: string;
}

export default function AdminEmails() {
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; email: string; status: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; hr_contact_email: string | null; status: string }>>([]);
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [error, setError] = useState('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all_students');
  const [customEmails, setCustomEmails] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, cRes] = await Promise.all([
        supabase.from('students').select('id, full_name, email, status').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, name, hr_contact_email, status').order('created_at', { ascending: false }),
      ]);
      if (sRes.error) console.error('Error fetching students:', sRes.error.message);
      if (cRes.error) console.error('Error fetching companies:', cRes.error.message);
      setStudents(sRes.data ?? []);
      setCompanies(cRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const loadHistory = async () => {
    const { data, error: err } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (err) console.error('Error fetching email logs:', err.message);
    setHistory((data ?? []) as EmailLog[]);
  };

  useEffect(() => { loadHistory(); }, []);

  const getRecipients = (): string[] => {
    switch (audience) {
      case 'all_students': return students.map(s => s.email);
      case 'active_students': return students.filter(s => s.status === 'active').map(s => s.email);
      case 'all_companies': return companies.map(c => c.hr_contact_email).filter(Boolean) as string[];
      case 'approved_companies': return companies.filter(c => c.status === 'approved').map(c => c.hr_contact_email).filter(Boolean) as string[];
      case 'custom': return customEmails.split(',').map(e => e.trim()).filter(Boolean);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getRecipients();
    if (recipients.length === 0 || !subject.trim() || !body.trim()) return;
    setSending(true);
    setSentMsg('');
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const { error: logErr } = await supabase.from('email_logs').insert({
      sent_by: user?.id,
      subject: subject.trim(),
      body: body.trim(),
      audience,
      recipient_count: recipients.length,
      status: 'logged',
    });

    if (logErr) {
      setError('Failed to log broadcast: ' + logErr.message);
      setSending(false);
      return;
    }

    const studentRecipients = students.filter(s => recipients.includes(s.email));
    if (studentRecipients.length > 0) {
      const notificationRows = studentRecipients.map(s => ({
        user_id: s.id,
        title: subject.trim(),
        message: body.trim(),
        type: 'info' as const,
        read: false,
      }));
      const { error: notifErr } = await supabase.from('notifications').insert(notificationRows);
      if (notifErr) console.error('Failed to create notifications:', notifErr.message);
    }

    setSentMsg(`Broadcast logged for ${recipients.length} recipient(s). In-app notifications sent to students.`);
    setSubject('');
    setBody('');
    setCustomEmails('');
    setSending(false);
    loadHistory();
  };

  const audienceCounts: Record<Audience, number> = {
    all_students: students.length,
    active_students: students.filter(s => s.status === 'active').length,
    all_companies: companies.filter(c => c.hr_contact_email).length,
    approved_companies: companies.filter(c => c.status === 'approved' && c.hr_contact_email).length,
    custom: customEmails.split(',').filter(Boolean).length,
  };

  const audienceOptions: { key: Audience; label: string; icon: typeof Users }[] = [
    { key: 'all_students', label: 'All Students', icon: Users },
    { key: 'active_students', label: 'Active Students', icon: Users },
    { key: 'all_companies', label: 'All Companies', icon: Building2 },
    { key: 'approved_companies', label: 'Approved Companies', icon: Building2 },
    { key: 'custom', label: 'Custom Recipients', icon: Mail },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Email Center</h1>
          <p className="text-gray-400 text-sm">Send announcements and broadcasts to students and companies. All broadcasts are logged with recipient counts for audit purposes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-5">
            <h2 className="text-white font-semibold flex items-center gap-2"><Send size={16} className="text-gold-500" /> Compose Broadcast</h2>

            <div>
              <label className="label">Audience</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {audienceOptions.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setAudience(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm border transition-colors text-left ${audience === key ? 'border-gold-600 bg-gold-600/10 text-gold-400' : 'border-dark-300 text-gray-400 hover:text-white hover:border-dark-200'}`}>
                    <Icon size={14} />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs text-gray-500">{audienceCounts[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            {audience === 'custom' && (
              <div>
                <label className="label">Custom Email Addresses (comma-separated)</label>
                <input className="input" placeholder="student1@email.com, student2@email.com" value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} />
              </div>
            )}

            <div>
              <label className="label">Subject *</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Announcement subject" />
            </div>

            <div>
              <label className="label">Message *</label>
              <textarea rows={8} className="input resize-none" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
            </div>

            {error && <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm">{error}</div>}
            {sentMsg && <div className="px-4 py-3 bg-forest-600/10 border border-forest-600/30 text-forest-400 text-sm flex items-center gap-2"><CheckCircle size={15} /> {sentMsg}</div>}

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">{getRecipients().length} recipient(s) selected</span>
              <button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim() || getRecipients().length === 0} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                {sending ? <div className="w-4 h-4 border-2 border-dark-800/40 border-t-dark-800 rounded-full animate-spin" /> : <Send size={15} />}
                Send Broadcast
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-white font-semibold mb-4">Recent Broadcasts</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 shimmer" />)}</div>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No broadcasts sent yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="py-3 border-b border-dark-300 last:border-0">
                    <div className="text-white text-sm font-medium line-clamp-1">{h.subject}</div>
                    <div className="text-gray-500 text-xs line-clamp-2 mt-1">{h.body}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-gray-600 text-xs">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                      <span className="text-gold-500 text-xs">{h.recipient_count} recipients</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
