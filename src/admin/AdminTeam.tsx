import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, X, AlertTriangle, Upload, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

const emptyForm = {
  name: '',
  role: '',
  photo_url: '',
  display_order: 0,
  is_visible: true,
};

type FormState = typeof emptyForm;

export default function AdminTeam() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('team_members')
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
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(true);
  };

  const openEdit = (item: TeamMember) => {
    setForm({
      name: item.name,
      role: item.role,
      photo_url: item.photo_url || '',
      display_order: item.display_order,
      is_visible: item.is_visible,
    });
    setEditId(item.id);
    setPhotoPreview(item.photo_url || '');
    setPhotoFile(null);
    setShowForm(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploadingPhoto(true);
    const path = `team-photos/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('internship-assets')
      .upload(path, file, { upsert: true });
    setUploadingPhoto(false);
    if (error || !data) return null;
    const { data: { publicUrl } } = supabase.storage.from('internship-assets').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    setSaving(true);

    let photoUrl = form.photo_url;
    if (photoFile) {
      const uploaded = await uploadPhoto(photoFile);
      if (uploaded) photoUrl = uploaded;
    }

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      photo_url: photoUrl || null,
      display_order: Number(form.display_order) || 0,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (editId) {
      result = await supabase.from('team_members').update(payload).eq('id', editId);
    } else {
      result = await supabase.from('team_members').insert(payload);
    }

    if (result.error) {
      alert(`Failed to save team member: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditId(null);
    setPhotoFile(null);
    setPhotoPreview('');
    await fetchItems();
    setSaving(false);
  };

  const toggleVisibility = async (item: TeamMember) => {
    await supabase
      .from('team_members')
      .update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('team_members').delete().eq('id', deleteId);
    setDeleteId(null);
    await fetchItems();
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Team Members</h1>
            <p className="text-gray-400 text-sm">
              Manage the "Meet Our Team" section on the public About page.{' '}
              <span className="text-gold-500">{items.filter(i => i.is_visible).length} visible</span>
              {' '}/ {items.length} total
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Member
          </button>
        </div>

        <div className="flex items-start gap-3 px-4 py-3 bg-gold-600/5 border border-gold-600/20">
          <Users size={16} className="text-gold-500 mt-0.5 shrink-0" />
          <p className="text-gold-300/80 text-sm">
            Members marked as <strong>visible</strong> appear live on the About page under "Meet Our Team". Hidden members are not shown to visitors. Use <strong>Display Order</strong> to control the sequence — lower numbers appear first.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 shimmer" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dark-300">
            <Users size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Team Members Yet</h3>
            <p className="text-gray-500 text-sm mb-6">Add your first team member to display on the About page.</p>
            <button onClick={openAdd} className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <Plus size={14} /> Add First Member
            </button>
          </div>
        ) : (
          <div className="border border-dark-300">
            <table className="w-full">
              <thead>
                <tr>
                  {['Order', 'Photo', 'Name', 'Position', 'Visibility', 'Actions'].map(h => (
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
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="h-10 w-10 object-cover rounded-full border border-dark-300"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-dark-600 border border-dark-300 flex items-center justify-center text-gray-500 text-xs font-semibold">
                          {item.name[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-white text-sm font-medium">{item.name}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-gold-500 text-sm">{item.role}</span>
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-dark-300">
              <h2 className="text-lg font-bold text-white">
                {editId ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Aryan Kapoor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Position / Title *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Founder & CEO"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  Photo
                  <span className="text-gray-500 text-xs font-normal ml-2">(optional — initials shown if no photo)</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="relative border-2 border-dashed border-dark-300 hover:border-gold-600/40 transition-colors cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="p-4 text-center">
                      <Upload size={18} className="text-gray-600 mx-auto mb-1" />
                      <p className="text-gray-500 text-xs">
                        {photoFile ? photoFile.name : 'Click to upload photo'}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">PNG, JPG, SVG, WebP</p>
                    </div>
                  </div>
                  {photoPreview && (
                    <div className="w-20 h-20 border border-dark-300 p-1 flex items-center justify-center bg-dark-600 shrink-0 overflow-hidden rounded-full">
                      <img src={photoPreview} alt="Preview" className="max-h-full max-w-full object-cover rounded-full" />
                    </div>
                  )}
                </div>
                {(form.photo_url && !photoFile) && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500 text-xs">Current photo set</span>
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, photo_url: '' }); setPhotoPreview(''); }}
                      className="text-red-400 text-xs hover:text-red-300 transition-colors"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

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

              <div className="flex items-center gap-3 py-3 px-4 bg-dark-600 border border-dark-300">
                <input
                  type="checkbox"
                  id="team_visible"
                  checked={form.is_visible}
                  onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                  className="w-4 h-4 accent-gold-600"
                />
                <div>
                  <label htmlFor="team_visible" className="text-white text-sm font-medium cursor-pointer">
                    Show on About page
                  </label>
                  <p className="text-gray-500 text-xs mt-0.5">Uncheck to hide without deleting</p>
                </div>
              </div>

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
                  disabled={saving || uploadingPhoto || !form.name.trim() || !form.role.trim()}
                  className="btn-primary px-5 py-2.5 text-sm flex-1 flex items-center justify-center gap-2"
                >
                  {saving || uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-dark-800/40 border-t-dark-800 rounded-full animate-spin" />
                  ) : (
                    <>{editId ? 'Save Changes' : 'Add Member'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="text-white font-semibold">Remove Team Member?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              This member will be permanently removed from the About page team section.
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
