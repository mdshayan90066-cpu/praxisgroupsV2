import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Pause, Building2, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../lib/types';

const emptyForm = {
  name: '',
  slug: '',
  website: '',
  industry: '',
  description: '',
  hr_contact_name: '',
  hr_contact_email: '',
  hr_contact_phone: '',
  linkedin_url: '',
  status: 'approved' as 'pending' | 'approved' | 'rejected' | 'suspended',
};

type FormState = typeof emptyForm;

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'companies' | 'requests'>('companies');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchData = async () => {
    const [cRes, rRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('company_partnership_requests').select('*').order('created_at', { ascending: false }),
    ]);
    setCompanies(cRes.data ?? []);
    setRequests(rRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: Company['status']) => {
    await supabase.from('companies').update({ status }).eq('id', id);
    await fetchData();
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from('company_partnership_requests').update({ status }).eq('id', id);
    await fetchData();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    let logoUrl = logoPreview;
    if (logoFile) {
      setUploadingLogo(true);
      const url = await uploadFile(logoFile, 'company-assets', `logos/${Date.now()}-${logoFile.name}`);
      if (url) logoUrl = url;
      setUploadingLogo(false);
    }

    const payload = {
      ...form,
      logo_url: logoUrl || null,
      slug: form.slug || slugify(form.name),
    };

    let result;
    if (editId) {
      result = await supabase.from('companies').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
    } else {
      result = await supabase.from('companies').insert(payload);
    }

    if (result.error) {
      setSaveError(`Failed to save: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview('');
    await fetchData();
    setSaving(false);
  };

  const handleEdit = (c: Company) => {
    setForm({
      name: c.name,
      slug: c.slug || '',
      website: c.website || '',
      industry: c.industry || '',
      description: c.description || '',
      hr_contact_name: c.hr_contact_name || '',
      hr_contact_email: c.hr_contact_email || '',
      hr_contact_phone: c.hr_contact_phone || '',
      linkedin_url: c.linkedin_url || '',
      status: c.status,
    });
    setLogoPreview(c.logo_url || '');
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('companies').delete().eq('id', deleteId);
    setDeleteId(null);
    await fetchData();
  };

  const filteredCompanies = companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const statusColors: Record<string, string> = { pending: 'badge-gray', approved: 'badge-green', rejected: 'badge-red', suspended: 'badge-red' };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Companies</h1>
            <p className="text-gray-400 text-sm">{companies.filter(c => c.status === 'approved').length} approved partners</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setLogoPreview(''); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Company
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-dark-300">
          {[
            { key: 'companies', label: `Companies (${companies.length})` },
            { key: 'requests', label: `Partnership Requests (${requests.filter(r => r.status === 'pending').length})` }
          ].map(({ key, label }) => (
            <button 
              key={key} 
              onClick={() => setTab(key as 'companies' | 'requests')} 
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-gold-600 text-gold-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'companies' && (
          <>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="border border-dark-300 rounded-xl overflow-hidden bg-black">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      {['Company', 'Industry', 'Contact', 'Status', 'Actions'].map(h => <th key={h} className="p-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredCompanies.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">No companies found.</td></tr>
                    ) : filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center rounded-lg">
                              {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover rounded-lg" alt="" /> : <Building2 size={14} className="text-gray-400" />}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{c.name}</div>
                              {c.website && <div className="text-gray-500 text-xs">{c.website}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-400">{c.industry || '—'}</td>
                        <td className="p-3 text-xs text-gray-400">{c.hr_contact_email || '—'}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[c.status] || 'bg-zinc-800 text-zinc-400'}`}>{c.status}</span></td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {c.status !== 'approved' && <button onClick={() => updateStatus(c.id, 'approved')} className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors"><CheckCircle size={14} /></button>}
                            {c.status !== 'rejected' && <button onClick={() => updateStatus(c.id, 'rejected')} className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors"><XCircle size={14} /></button>}
                            {c.status !== 'suspended' && <button onClick={() => updateStatus(c.id, 'suspended')} className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors"><Pause size={14} /></button>}
                            <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"><Edit size={14} /></button>
                            <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'requests' && (
          <div className="border border-dark-300 rounded-xl overflow-hidden bg-black">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  {['Company', 'Contact', 'Message', 'Status', 'Actions'].map(h => <th key={h} className="p-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {requests.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">No partnership requests pending.</td></tr>
                ) : requests.map((r) => (
                  <tr key={r.id as string} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-3">
                      <div className="text-white text-sm font-medium">{r.company_name as string}</div>
                      {Boolean(r.industry) && <div className="text-gray-500 text-xs">{r.industry as string}</div>}
                    </td>
                    <td className="p-3 text-xs text-gray-400">{r.contact_email as string}</td>
                    <td className="p-3 text-xs text-gray-400 max-w-xs truncate">{r.message as string || '—'}</td>
                    <td className="p-3"><span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-800 text-zinc-400 capitalize">{r.status as string}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => updateRequestStatus(r.id as string, 'approved')} className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors"><CheckCircle size={14} /></button>
                            <button onClick={() => updateRequestStatus(r.id as string, 'rejected')} className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors"><XCircle size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-xl font-bold text-white">{editId ? 'Edit Company' : 'Add Company'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {saveError && <div className="p-3 bg-red-900/50 border border-red-500/50 text-red-200 text-sm rounded-lg">{saveError}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-black border border-zinc-700 rounded-xl overflow-hidden flex items-center justify-center relative group">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={24} className="text-gray-600" />
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Upload size={16} className="text-white" />
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">Square ratio recommended (e.g., 400x400px).<br/>Max file size 2MB.</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="e.g. Google" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Website URL</label>
                  <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="input" placeholder="https://" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                  <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="input" placeholder="e.g. Technology" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn URL</label>
                  <input type="url" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} className="input" placeholder="https://linkedin.com/company/..." />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input py-2" placeholder="Brief company overview..." />
                </div>

                <div className="col-span-full border-t border-zinc-800 my-2 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-4">HR Contact Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Name</label>
                  <input type="text" value={form.hr_contact_name} onChange={e => setForm({...form, hr_contact_name: e.target.value})} className="input" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email</label>
                  <input type="email" value={form.hr_contact_email} onChange={e => setForm({...form, hr_contact_email: e.target.value})} className="input" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="input">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-zinc-800">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-6 py-2.5">Cancel</button>
                <button type="submit" disabled={saving || uploadingLogo} className="btn-primary flex-1 px-6 py-2.5">
                  {saving || uploadingLogo ? 'Saving...' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Company?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. Are you sure you want to proceed?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1 py-2">Cancel</button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg flex-1 py-2 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
