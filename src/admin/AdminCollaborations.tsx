import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, X, AlertTriangle, Upload, Globe, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Collaboration {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

const emptyForm = {
  name: '',
  logo_url: '',
  website_url: '',
  display_order: 0,
  is_visible: true,
};

type FormState = typeof emptyForm;

export default function AdminCollaborations() {
  const [items, setItems] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('industry_collaborations')
      .select('*')
      .order('display_order')
      .order('created_at');
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 0;
    setForm({ ...emptyForm, display_order: nextOrder });
    setEditId(null);
    setLogoFile(null);
    setLogoPreview('');
    setShowForm(true);
  };

  const openEdit = (item: Collaboration) => {
    setForm({
      name: item.name,
      logo_url: item.logo_url || '',
      website_url: item.website_url || '',
      display_order: item.display_order,
      is_visible: item.is_visible,
    });
    setEditId(item.id);
    setLogoPreview(item.logo_url || '');
    setLogoFile(null);
    setShowForm(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    setUploadingLogo(true);
    const path = `collaboration-logos/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('internship-assets')
      .upload(path, file, { upsert: true });
    setUploadingLogo(false);
    if (error || !data) return null;
    const { data: { publicUrl } } = supabase.storage.from('internship-assets').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    let logoUrl = form.logo_url;
    if (logoFile) {
      const uploaded = await uploadLogo(logoFile);
      if (uploaded) logoUrl = uploaded;
    }

    const payload = {
      name: form.name.trim(),
      logo_url: logoUrl || null,
      website_url: form.website_url.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      await supabase.from('industry_collaborations').update(payload).eq('id', editId);
    } else {
      await supabase.from('industry_collaborations').insert(payload);
    }

    setShowForm(false);
    setEditId(null);
    setLogoFile(null);
    setLogoPreview('');
    await fetchItems();
    setSaving(false);
  };

  const toggleVisibility = async (item: Collaboration) => {
    await supabase
      .from('industry_collaborations')
      .update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('industry_collaborations').delete().eq('id', deleteId);
    setDeleteId(null);
    await fetchItems();
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Industry Collaborations</h1>
            <p className="text-gray-400 text-sm">
              Manage the partner companies displayed on the public homepage.{' '}
              <span className="text-gold-500">{items.filter(i => i.is_visible).length} visible</span>
              {' '}/ {items.length} total
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Company
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 bg-gold-600/5 border border-gold-600/20">
          <Globe size={16} className="text-gold-500 mt-0.5 shrink-0" />
          <p className="text-gold-300/80 text-sm">
            Companies marked as <strong>visible</strong> appear live on the homepage under "Industry Collaborations". Hidden companies are not shown to visitors. Use <strong>Display Order</strong> to control the sequence — lower numbers appear first.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 shimmer" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dark-300">
            <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Collaborations Yet</h3>
            <p className="text-gray-500 text-sm mb-6">Add your first industry partner to display it on the homepage.</p>
            <button onClick={openAdd} className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <Plus size={14} /> Add First Company
            </button>
          </div>
        ) : (
          <div className="border border-dark-300">
            <table className="w-full">
              <thead>
                <tr>
                  {['Order', 'Company', 'Logo', 'Website', 'Visibility', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-600/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-gray-600" />
                        <span className="text-gray-400 text-sm font-mono w-8 text-center">{item.display_order}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-white text-sm font-medium">{item.name}</span>
                    </td>
                    <td className="table-cell">
                      {item.logo_url ? (
                        <img
                          src={item.logo_url}
                          alt={item.name}
                          className="h-8 w-auto max-w-[80px] object-contain"
                        />
                      ) : (
                        <span className="text-gray-600 text-xs italic">Text only</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {item.website_url ? (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold-500 hover:text-gold-400 text-xs underline truncate block max-w-[140px]"
                        >
                          {item.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => toggleVisibility(item)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 border transition-colors ${
                          item.is_visible
                            ? 'border-forest-600/40 text-forest-400 hover:bg-forest-600/10'
                            : 'border-dark-200 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {item.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-gold-500 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
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
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-dark-300">
              <h2 className="text-lg font-bold text-white">
                {editId ? 'Edit Collaboration' : 'Add Industry Collaboration'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Company Name */}
              <div>
                <label className="label">Company Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Tata Consultancy Services"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="label">
                  Company Logo
                  <span className="text-gray-500 text-xs font-normal ml-2">(optional — name shown as text if no logo)</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="relative border-2 border-dashed border-dark-300 hover:border-gold-600/40 transition-colors cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="p-4 text-center">
                      <Upload size={18} className="text-gray-600 mx-auto mb-1" />
                      <p className="text-gray-500 text-xs">
                        {logoFile ? logoFile.name : 'Click to upload logo'}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">PNG, JPG, SVG, WebP</p>
                    </div>
                  </div>
                  {logoPreview && (
                    <div className="w-20 h-16 border border-dark-300 p-2 flex items-center justify-center bg-dark-600 shrink-0">
                      <img src={logoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
                {(form.logo_url && !logoFile) && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500 text-xs">Current logo set</span>
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, logo_url: '' }); setLogoPreview(''); }}
                      className="text-red-400 text-xs hover:text-red-300 transition-colors"
                    >
                      Remove logo
                    </button>
                  </div>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://company.com"
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                />
                <p className="text-gray-600 text-xs mt-1">If provided, the company tile will link to this URL.</p>
              </div>

              {/* Display Order */}
              <div>
                <label className="label">Display Order</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
                <p className="text-gray-600 text-xs mt-1">Lower numbers appear first. Current max: {items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0}</p>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-3 py-3 px-4 bg-dark-600 border border-dark-300">
                <input
                  type="checkbox"
                  id="collab_visible"
                  checked={form.is_visible}
                  onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                  className="w-4 h-4 accent-gold-600"
                />
                <div>
                  <label htmlFor="collab_visible" className="text-white text-sm font-medium cursor-pointer">
                    Show on homepage
                  </label>
                  <p className="text-gray-500 text-xs mt-0.5">Uncheck to hide without deleting</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-ghost px-5 py-2.5 text-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingLogo || !form.name.trim()}
                  className="btn-primary px-5 py-2.5 text-sm flex-1 flex items-center justify-center gap-2"
                >
                  {saving || uploadingLogo ? (
                    <div className="w-4 h-4 border-2 border-dark-800/40 border-t-dark-800 rounded-full animate-spin" />
                  ) : (
                    <>{editId ? 'Save Changes' : 'Add Company'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="text-white font-semibold">Remove Collaboration?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              This company will be permanently removed from the homepage collaborations list.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost px-4 py-2 text-sm flex-1">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger px-4 py-2 text-sm flex-1">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
