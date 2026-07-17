import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Copy, Search, X, AlertTriangle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workshop, WorkshopCategory } from '../lib/types';

const emptyForm = {
  thumbnail_url: '', banner_url: '', name: '', slug: '',
  category_id: '', workshop_type: 'online' as 'online' | 'offline' | 'hybrid',
  status: 'draft' as 'draft' | 'active' | 'closed' | 'archived', application_start_date: '', application_end_date: '',
  commencement_date: '', end_date: '', registration_deadline: '',
  instructor_name: '', instructor_image_url: '', duration: '',
  price_type: 'free' as 'free' | 'paid', price: '', currency: 'INR',
  seats_available: '', description: '', learning_outcomes: '',
  requirements: '', certificate_available: false,
  meeting_link: '', recording_link: '', tags: '',
  seo_title: '', seo_description: '',
};

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [categories, setCategories] = useState<WorkshopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [thumbnailError, setThumbnailError] = useState('');

  const fetchData = async () => {
    const [wRes, cRes] = await Promise.all([
      supabase.from('workshops').select('*, workshop_categories!workshops_category_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('workshop_categories').select('*').order('name'),
    ]);
    setWorkshops(wRes.data ?? []);
    setCategories(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void,
    clearError?: () => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      clearError?.();
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSave = async (status?: string) => {
    setThumbnailError('');
    if (!thumbnailFile && !form.thumbnail_url) {
      setThumbnailError('A thumbnail image is required before publishing.');
      if (status === 'active') return;
    }

    setSaving(true);
    let thumbnailUrl = form.thumbnail_url;
    let bannerUrl = form.banner_url;

    if (thumbnailFile) {
      const url = await uploadFile(thumbnailFile, 'workshop-assets', `thumbnails/${Date.now()}-${thumbnailFile.name}`);
      if (url) thumbnailUrl = url;
    }
    if (bannerFile) {
      const url = await uploadFile(bannerFile, 'workshop-assets', `banners/${Date.now()}-${bannerFile.name}`);
      if (url) bannerUrl = url;
    }

    const payload = {
      thumbnail_url: thumbnailUrl || null,
      banner_url: bannerUrl || null,
      name: form.name,
      slug: form.slug || slugify(form.name),
      category_id: form.category_id || null,
      workshop_type: form.workshop_type,
      description: form.description || null,
      learning_outcomes: form.learning_outcomes ? form.learning_outcomes.split('\n').filter(Boolean) : null,
      requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : null,
      duration: form.duration || null,
      price_type: form.price_type,
      price: form.price ? parseFloat(form.price) : 0,
      currency: form.currency,
      seats_available: form.seats_available ? parseInt(form.seats_available) : null,
      application_start_date: form.application_start_date || null,
      application_end_date: form.application_end_date || null,
      commencement_date: form.commencement_date || null,
      end_date: form.end_date || null,
      registration_deadline: form.registration_deadline || null,
      instructor_name: form.instructor_name || null,
      instructor_image_url: form.instructor_image_url || null,
      certificate_available: form.certificate_available,
      meeting_link: form.meeting_link || null,
      recording_link: form.recording_link || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : null,
      status: (status as Workshop['status']) || form.status,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    };

    let result;
    if (editId) {
      result = await supabase.from('workshops').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
    } else {
      result = await supabase.from('workshops').insert(payload);
    }

    if (result.error) {
      setSaveError(`Failed to save: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setSaveError('');
    setEditId(null);
    setForm(emptyForm);
    setThumbnailFile(null);
    setBannerFile(null);
    setThumbnailPreview('');
    setBannerPreview('');
    await fetchData();
    setSaving(false);
  };

  const handleEdit = (w: Workshop) => {
    setForm({
      thumbnail_url: w.thumbnail_url || '',
      banner_url: w.banner_url || '',
      name: w.name,
      slug: w.slug,
      category_id: w.category_id || '',
      workshop_type: w.workshop_type,
      description: w.description || '',
      learning_outcomes: w.learning_outcomes?.join('\n') || '',
      requirements: w.requirements?.join('\n') || '',
      duration: w.duration || '',
      price_type: w.price_type,
      price: w.price?.toString() || '',
      currency: w.currency || 'INR',
      seats_available: w.seats_available?.toString() || '',
      application_start_date: w.application_start_date ? new Date(w.application_start_date).toISOString().slice(0, 16) : '',
      application_end_date: w.application_end_date ? new Date(w.application_end_date).toISOString().slice(0, 16) : '',
      commencement_date: w.commencement_date ? new Date(w.commencement_date).toISOString().slice(0, 16) : '',
      end_date: w.end_date ? new Date(w.end_date).toISOString().slice(0, 16) : '',
      registration_deadline: w.registration_deadline ? new Date(w.registration_deadline).toISOString().slice(0, 16) : '',
      instructor_name: w.instructor_name || '',
      instructor_image_url: w.instructor_image_url || '',
      certificate_available: w.certificate_available || false,
      meeting_link: w.meeting_link || '',
      recording_link: w.recording_link || '',
      tags: w.tags?.join(', ') || '',
      status: w.status,
      seo_title: w.seo_title || '',
      seo_description: w.seo_description || '',
    });
    setThumbnailPreview(w.thumbnail_url || '');
    setBannerPreview(w.banner_url || '');
    setEditId(w.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('workshops').delete().eq('id', deleteId);
    setDeleteId(null);
    await fetchData();
  };

  const handleDuplicate = async (w: Workshop) => {
    const { id: _id, created_at: _created_at, updated_at: _updated_at, ...rest } = w;
    await supabase.from('workshops').insert({ 
      ...rest, 
      name: `${w.name} (Copy)`, 
      slug: `${w.slug}-copy-${Date.now()}`, 
      status: 'draft' 
    });
    await fetchData();
  };

  const filtered = workshops.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()));
  const statusColors: Record<string, string> = { draft: 'bg-gray-500/10 text-gray-400', active: 'bg-emerald-500/10 text-emerald-400', closed: 'bg-rose-500/10 text-rose-400', archived: 'bg-zinc-500/10 text-zinc-400' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Workshops Management</h1>
          <p className="text-gray-400 text-xs mt-0.5">Manage live sessions, content modules, and registrations.</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Workshop
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search workshops by title name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-[var(--card-bg)] animate-pulse opacity-40" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((w) => (
            <div key={w.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full border border-white/5 capitalize ${statusColors[w.status] || 'bg-gray-500/10 text-gray-400'}`}>
                    {w.status}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{w.workshop_type}</span>
                </div>
                <h3 className="text-white font-semibold text-sm truncate">{w.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{w.description || 'No summary overview provided.'}</p>
              </div>
              
              <div className="p-3 border-t border-[var(--card-border)] bg-[var(--bg-muted)] flex items-center justify-end gap-2">
                <button onClick={() => handleEdit(w)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors" title="Edit"><Edit size={14} /></button>
                <button onClick={() => handleDuplicate(w)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors" title="Duplicate"><Copy size={14} /></button>
                <button onClick={() => setDeleteId(w.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-colors" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl max-w-md mx-auto">
          <AlertTriangle className="mx-auto text-gray-500 mb-2" size={24} />
          <h3 className="text-white font-medium text-sm">No Workshops Found</h3>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-white font-bold text-base">Confirm Deletion</h3>
            <p className="text-gray-400 text-xs">Are you sure you want to delete this workshop configuration? This layout option cannot be undone.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold">Delete Permanent</button>
            </div>
          </div>
        </div>
      )}

      {/* Workshop Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl w-full max-w-5xl my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--card-border)] bg-[var(--card-bg)] rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-white">{editId ? 'Edit Workshop' : 'Create New Workshop'}</h2>
                <p className="text-gray-400 text-sm mt-1">Fill in the details to setup your workshop.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {saveError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>{saveError}</p>
                </div>
              )}

              <div className="space-y-8">
                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">Media Assets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Thumbnail *</label>
                      <div className={`border-2 border-dashed p-4 text-center cursor-pointer relative ${thumbnailError ? 'border-red-600/60' : 'border-slate-700'}`}>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setThumbnailFile, setThumbnailPreview, () => setThumbnailError(''))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        {thumbnailPreview ? <img src={thumbnailPreview} className="w-full h-28 object-cover mx-auto" /> : <Upload size={22} className="text-gray-600 mx-auto" />}
                      </div>
                      {thumbnailError && <p className="text-red-400 text-xs mt-1">{thumbnailError}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Banner</label>
                      <div className="border-2 border-dashed border-slate-700 p-4 text-center cursor-pointer relative">
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setBannerFile, setBannerPreview)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        {bannerPreview ? <img src={bannerPreview} className="w-full h-28 object-cover mx-auto" /> : <Upload size={22} className="text-gray-600 mx-auto" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                      <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                    <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Details & Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Workshop Type</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.workshop_type} onChange={(e) => setForm({ ...form, workshop_type: e.target.value as any })}>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Duration</label>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g. 2 hours" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Seats Available</label>
                      <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.seats_available} onChange={(e) => setForm({ ...form, seats_available: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Learning Outcomes (one per line)</label>
                      <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.learning_outcomes} onChange={(e) => setForm({ ...form, learning_outcomes: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Requirements (one per line)</label>
                      <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Dates & Pricing */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Dates & Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Application Start</label>
                      <input type="datetime-local" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.application_start_date} onChange={(e) => setForm({ ...form, application_start_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Application End</label>
                      <input type="datetime-local" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.application_end_date} onChange={(e) => setForm({ ...form, application_end_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Price Type</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.price_type} onChange={(e) => setForm({ ...form, price_type: e.target.value as any })}>
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {form.price_type === 'paid' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Price</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--card-border)] bg-[var(--bg-muted)] flex items-center justify-between rounded-b-xl">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-gray-400 hover:text-white transition-colors text-sm font-semibold">
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl border border-slate-700 text-white hover:bg-slate-800 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('active')}
                  disabled={saving}
                  className="btn-primary text-sm px-5 py-2"
                >
                  {saving ? 'Publishing...' : 'Publish Workshop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
