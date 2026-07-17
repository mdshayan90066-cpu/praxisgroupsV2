import { useEffect, useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CompanyLayout from './CompanyLayout';
import { Company } from '../lib/types';

export default function CompanyProfile() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', website: '', industry: '',
    hr_contact_name: '', hr_contact_email: '', hr_contact_phone: '', linkedin_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

        const { data: co, error: coErr } = await supabase
          .from('companies')
          .select('*')
          .eq('id', cu.company_id)
          .maybeSingle();
        if (coErr) throw coErr;
        setCompany(co);
        if (co) {
          setForm({
            name: co.name || '', description: co.description || '', website: co.website || '',
            industry: co.industry || '', hr_contact_name: co.hr_contact_name || '',
            hr_contact_email: co.hr_contact_email || '', hr_contact_phone: co.hr_contact_phone || '',
            linkedin_url: co.linkedin_url || '',
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);
    const { error: uErr } = await supabase.from('companies').update({
      name: form.name, description: form.description, website: form.website,
      industry: form.industry, hr_contact_name: form.hr_contact_name,
      hr_contact_email: form.hr_contact_email, hr_contact_phone: form.hr_contact_phone,
      linkedin_url: form.linkedin_url, updated_at: new Date().toISOString(),
    }).eq('id', company.id);
    if (uErr) { setError(uErr.message); setSaving(false); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setSaving(false);
  };

  if (loading) {
    return <CompanyLayout><div className="max-w-2xl mx-auto space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 shimmer" />)}</div></CompanyLayout>;
  }

  if (error && !company) {
    return <CompanyLayout><div className="max-w-2xl mx-auto"><div className="card text-center py-12"><p className="text-red-400 mb-4">{error}</p><button onClick={() => window.location.reload()} className="btn-secondary">Retry</button></div></div></CompanyLayout>;
  }

  return (
    <CompanyLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Company Profile</h1>
          <p className="text-gray-400 text-sm">Update your company information visible to students.</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-dark-300">
            <div className="w-16 h-16 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center">
              <Building2 size={28} className="text-gold-500" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">{company?.name || 'Company'}</div>
              <div className="text-gray-400 text-sm">{company?.industry || 'Industry not set'}</div>
              <div className="mt-1">
                <span className={`badge ${company?.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>
                  {company?.status || 'pending'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[100px] resize-y" placeholder="Tell students about your company..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Website</label>
                <input className="input" placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <label className="label">Industry</label>
                <input className="input" placeholder="e.g. Technology" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>

            <div className="pt-2 border-t border-dark-300">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">HR Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" value={form.hr_contact_name} onChange={(e) => setForm({ ...form, hr_contact_name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" type="email" value={form.hr_contact_email} onChange={(e) => setForm({ ...form, hr_contact_email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input className="input" value={form.hr_contact_phone} onChange={(e) => setForm({ ...form, hr_contact_phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input className="input" placeholder="https://linkedin.com/..." value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
                </div>
              </div>
            </div>

            {error && <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm">{error}</div>}
            {success && <div className="px-4 py-3 bg-forest-600/10 border border-forest-600/30 text-forest-400 text-sm">Profile updated successfully!</div>}

            <button type="submit" disabled={saving} className="btn-primary px-6 py-3 flex items-center gap-2">
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </CompanyLayout>
  );
}
