import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search, X, Upload, AlertTriangle, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Internship, InternshipCategory, Company } from '../lib/types';

const emptyForm = {
  thumbnail_url: '', company_logo_url: '', banner_url: '',
  name: '', slug: '', category_id: '', domain: '', company_id: '', partner_company_name: '',
  description: '', roles: '', responsibilities: '', skills_required: '', eligibility: '',
  duration: '', work_mode: 'remote' as 'remote' | 'hybrid' | 'on-site', location: '', number_of_openings: '',
  application_start_date: '', application_end_date: '', internship_start_date: '', internship_end_date: '',
  stipend_type: 'unpaid' as 'paid' | 'unpaid', stipend_amount: '', stipend_currency: 'INR',
  certificate_provided: true, lor_provided: false, projects_included: false,
  mentor: '', assessment_criteria: '',
  status: 'draft' as 'draft' | 'open' | 'closed' | 'archived', seo_title: '', seo_description: '',
};

type FormState = typeof emptyForm;

export default function AdminInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [categories, setCategories] = useState<InternshipCategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [thumbnailError, setThumbnailError] = useState('');

  const fetchData = async () => {
    const [iRes, cRes, coRes] = await Promise.all([
      supabase.from('internships').select('*, internship_categories!internships_category_id_fkey(*), companies(*)').order('created_at', { ascending: false }),
      supabase.from('internship_categories').select('*').order('name'),
      supabase.from('companies').select('*').eq('status', 'approved').order('name'),
    ]);
    setInternships(iRes.data ?? []);
    setCategories(cRes.data ?? []);
    setCompanies(coRes.data ?? []);
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
      if (status === 'open') return;
    }

    setSaving(true);
    let thumbnailUrl = form.thumbnail_url;
    let companyLogoUrl = form.company_logo_url;
    let bannerUrl = form.banner_url;

    if (thumbnailFile) {
      const url = await uploadFile(thumbnailFile, 'internship-assets', `thumbnails/${Date.now()}-${thumbnailFile.name}`);
      if (url) thumbnailUrl = url;
    }
    if (companyLogoFile) {
      const url = await uploadFile(companyLogoFile, 'internship-assets', `logos/${Date.now()}-${companyLogoFile.name}`);
      if (url) companyLogoUrl = url;
    }
    if (bannerFile) {
      const url = await uploadFile(bannerFile, 'internship-assets', `banners/${Date.now()}-${bannerFile.name}`);
      if (url) bannerUrl = url;
    }

    const payload = {
      thumbnail_url: thumbnailUrl || null,
      company_logo_url: companyLogoUrl || null,
      banner_url: bannerUrl || null,
      name: form.name,
      slug: form.slug || slugify(form.name),
      category_id: form.category_id || null,
      domain: form.domain || null,
      company_id: form.company_id || null,
      partner_company_name: form.partner_company_name || null,
      description: form.description || null,
      roles: form.roles ? form.roles.split('\n').filter(Boolean) : null,
      responsibilities: form.responsibilities ? form.responsibilities.split('\n').filter(Boolean) : null,
      skills_required: form.skills_required ? form.skills_required.split(',').map(s => s.trim()).filter(Boolean) : null,
      eligibility: form.eligibility || null,
      duration: form.duration || null,
      work_mode: form.work_mode,
      location: form.location || null,
      number_of_openings: form.number_of_openings ? parseInt(form.number_of_openings) : null,
      application_start_date: form.application_start_date || null,
      application_end_date: form.application_end_date || null,
      internship_start_date: form.internship_start_date || null,
      internship_end_date: form.internship_end_date || null,
      stipend_type: form.stipend_type,
      stipend_amount: form.stipend_amount ? parseFloat(form.stipend_amount) : null,
      stipend_currency: form.stipend_currency,
      certificate_provided: form.certificate_provided,
      lor_provided: form.lor_provided,
      projects_included: form.projects_included,
      mentor: form.mentor || null,
      assessment_criteria: form.assessment_criteria || null,
      status: (status as Internship['status']) || form.status,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    };

    let result;
    if (editId) {
      result = await supabase.from('internships').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
    } else {
      result = await supabase.from('internships').insert(payload);
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
    setCompanyLogoFile(null);
    setBannerFile(null);
    setThumbnailPreview('');
    setCompanyLogoPreview('');
    setBannerPreview('');
    await fetchData();
    setSaving(false);
  };

  const handleEdit = (i: Internship) => {
    setForm({
      thumbnail_url: i.thumbnail_url || '',
      company_logo_url: i.company_logo_url || '',
      banner_url: i.banner_url || '',
      name: i.name,
      slug: i.slug,
      category_id: i.category_id || '',
      domain: i.domain || '',
      company_id: i.company_id || '',
      partner_company_name: i.partner_company_name || '',
      description: i.description || '',
      roles: i.roles?.join('\n') || '',
      responsibilities: i.responsibilities?.join('\n') || '',
      skills_required: i.skills_required?.join(', ') || '',
      eligibility: i.eligibility || '',
      duration: i.duration || '',
      work_mode: i.work_mode,
      location: i.location || '',
      number_of_openings: i.number_of_openings?.toString() || '',
      application_start_date: i.application_start_date || '',
      application_end_date: i.application_end_date || '',
      internship_start_date: i.internship_start_date || '',
      internship_end_date: i.internship_end_date || '',
      stipend_type: i.stipend_type,
      stipend_amount: i.stipend_amount?.toString() || '',
      stipend_currency: i.stipend_currency,
      certificate_provided: i.certificate_provided,
      lor_provided: i.lor_provided,
      projects_included: i.projects_included,
      mentor: i.mentor || '',
      assessment_criteria: i.assessment_criteria || '',
      status: i.status,
      seo_title: i.seo_title || '',
      seo_description: i.seo_description || '',
    });
    setThumbnailPreview(i.thumbnail_url || '');
    setCompanyLogoPreview(i.company_logo_url || '');
    setBannerPreview(i.banner_url || '');
    setEditId(i.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('internships').delete().eq('id', deleteId);
    setDeleteId(null);
    await fetchData();
  };

  const filtered = internships.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const statusColors: Record<string, string> = { draft: 'badge-gray', open: 'badge-green', closed: 'badge-red', archived: 'badge-gray' };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Internship Management</h1>
            <p className="text-gray-400 text-sm">{internships.length} total internships</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setThumbnailPreview(''); setCompanyLogoPreview(''); setBannerPreview(''); setThumbnailFile(null); setThumbnailError(''); setShowForm(true); }} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Internship
          </button>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search internships..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 shimmer" />)}</div>
        ) : (
          <div className="border border-dark-300">
            <table className="w-full">
              <thead>
                <tr>
                  {['Internship', 'Company', 'Mode', 'Stipend', 'Status', 'Openings', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="table-cell text-center py-12 text-gray-500">No internships found.</td></tr>
                ) : filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-dark-600/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-dark-600 border border-dark-300 shrink-0 overflow-hidden">
                          {i.thumbnail_url ? <img src={i.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-600 m-auto mt-3" />}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium line-clamp-1">{i.name}</div>
                          <div className="text-gray-500 text-xs">{i.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm">{i.partner_company_name || (i as unknown as { companies?: { name?: string } }).companies?.name || '—'}</td>
                    <td className="table-cell capitalize text-sm">{i.work_mode}</td>
                    <td className="table-cell text-sm">{i.stipend_type === 'paid' ? `₹${i.stipend_amount?.toLocaleString()}` : 'Unpaid'}</td>
                    <td className="table-cell"><span className={`badge ${statusColors[i.status]}`}>{i.status}</span></td>
                    <td className="table-cell text-sm">{i.number_of_openings ?? '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(i)} className="p-1.5 text-gray-500 hover:text-gold-500 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => setDeleteId(i.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internship Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-4xl my-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-300">
              <h2 className="text-xl font-bold text-white">{editId ? 'Edit Internship' : 'Add New Internship'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Images — Thumbnail is REQUIRED */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Thumbnail - REQUIRED */}
                  <div>
                    <label className="label flex items-center gap-1.5">
                      Internship Thumbnail
                      <span className="text-red-400 text-xs font-normal">* Required</span>
                    </label>
                    <div className={`border-2 border-dashed transition-colors p-4 text-center cursor-pointer relative ${thumbnailError ? 'border-red-600/60' : thumbnailPreview || thumbnailFile ? 'border-forest-600/40' : 'border-dark-300 hover:border-gold-600/40'}`}>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setThumbnailFile, setThumbnailPreview, () => setThumbnailError(''))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-28 object-cover mx-auto" />
                      ) : (
                        <div className="py-5">
                          <Upload size={22} className="text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">Click to upload thumbnail</p>
                          <p className="text-gray-600 text-xs mt-1">PNG, JPG, WebP</p>
                        </div>
                      )}
                    </div>
                    {thumbnailError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle size={11} />{thumbnailError}</p>}
                    {(thumbnailFile || thumbnailPreview) && <p className="text-forest-400 text-xs mt-1">Thumbnail uploaded</p>}
                  </div>

                  {/* Company Logo */}
                  <div>
                    <label className="label">Company Logo</label>
                    <div className="border-2 border-dashed border-dark-300 hover:border-gold-600/40 transition-colors p-4 text-center cursor-pointer relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setCompanyLogoFile, setCompanyLogoPreview)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      {companyLogoPreview ? (
                        <img src={companyLogoPreview} alt="Preview" className="w-full h-28 object-contain mx-auto" />
                      ) : (
                        <div className="py-5">
                          <Upload size={22} className="text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">Company logo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banner */}
                  <div>
                    <label className="label">Internship Banner</label>
                    <div className="border-2 border-dashed border-dark-300 hover:border-gold-600/40 transition-colors p-4 text-center cursor-pointer relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setBannerFile, setBannerPreview)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Preview" className="w-full h-28 object-cover mx-auto" />
                      ) : (
                        <div className="py-5">
                          <Upload size={22} className="text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">Banner image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Internship Name *</label>
                  <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <input className="input font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Domain</label>
                  <input className="input" placeholder="e.g. Frontend Development" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
                </div>
                <div>
                  <label className="label">Partner Company</label>
                  <input
                    className="input"
                    placeholder="Company name"
                    list="approved-companies"
                    value={form.partner_company_name}
                    onChange={(e) => setForm({ ...form, partner_company_name: e.target.value })}
                  />
                  <datalist id="approved-companies">
                    {companies.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea rows={4} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Roles & Responsibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Roles (one per line)</label>
                  <textarea rows={4} className="input resize-none" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
                </div>
                <div>
                  <label className="label">Responsibilities (one per line)</label>
                  <textarea rows={4} className="input resize-none" value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Skills Required (comma-separated)</label>
                <input className="input" placeholder="Python, SQL, Excel, Communication" value={form.skills_required} onChange={(e) => setForm({ ...form, skills_required: e.target.value })} />
              </div>

              <div>
                <label className="label">Eligibility</label>
                <textarea rows={2} className="input resize-none" value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="e.g. 2 months" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <div>
                  <label className="label">Work Mode</label>
                  <select className="input" value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value as 'remote' | 'hybrid' | 'on-site' })}>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-Site</option>
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="City, India" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Number of Openings</label>
                  <input type="number" min={0} className="input" value={form.number_of_openings} onChange={(e) => setForm({ ...form, number_of_openings: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Internship['status'] })}>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'App. Start', key: 'application_start_date' },
                  { label: 'App. End', key: 'application_end_date' },
                  { label: 'Internship Start', key: 'internship_start_date' },
                  { label: 'Internship End', key: 'internship_end_date' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="date" className="input" value={(form as unknown as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>

              {/* Stipend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label">Stipend Type</label>
                  <select className="input" value={form.stipend_type} onChange={(e) => setForm({ ...form, stipend_type: e.target.value as 'paid' | 'unpaid' })}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                {form.stipend_type === 'paid' && (
                  <>
                    <div>
                      <label className="label">Stipend Amount/Month</label>
                      <input type="number" min={0} className="input" value={form.stipend_amount} onChange={(e) => setForm({ ...form, stipend_amount: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Currency</label>
                      <select className="input" value={form.stipend_currency} onChange={(e) => setForm({ ...form, stipend_currency: e.target.value })}>
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-6">
                {[
                  { key: 'certificate_provided', label: 'Certificate Provided' },
                  { key: 'lor_provided', label: 'Letter of Recommendation' },
                  { key: 'projects_included', label: 'Projects Included' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <input type="checkbox" id={key} checked={(form as unknown as Record<string, boolean>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 accent-gold-600" />
                    <label htmlFor={key} className="text-gray-300 text-sm cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>

              {/* Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Mentor</label>
                  <input className="input" value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} />
                </div>
                <div>
                  <label className="label">Assessment Criteria</label>
                  <input className="input" value={form.assessment_criteria} onChange={(e) => setForm({ ...form, assessment_criteria: e.target.value })} />
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-4 p-4 bg-dark-600 border border-dark-300">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">SEO</h3>
                <div>
                  <label className="label">SEO Title</label>
                  <input className="input" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                </div>
                <div>
                  <label className="label">SEO Description</label>
                  <textarea rows={2} className="input resize-none" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mx-6 mb-0 px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm">{saveError}</div>
            )}

            <div className="p-6 border-t border-dark-300 flex flex-wrap items-center gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
              <button onClick={() => handleSave('draft')} disabled={saving || !form.name} className="btn-secondary px-5 py-2.5 text-sm">Save Draft</button>
              <button onClick={() => handleSave('open')} disabled={saving || !form.name} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-dark-800/40 border-t-dark-800 rounded-full animate-spin" /> : <Eye size={15} />}
                {editId ? 'Update & Publish' : 'Publish Internship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="text-white font-semibold">Delete Internship?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost px-4 py-2 text-sm flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger px-4 py-2 text-sm flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
      </>
  );
}
