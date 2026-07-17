import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WorkshopCategory, InternshipCategory } from '../lib/types';

export default function AdminSettings() {
  const [workshopCats, setWorkshopCats] = useState<WorkshopCategory[]>([]);
  const [internshipCats, setInternshipCats] = useState<InternshipCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'system'>('categories');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [newWc, setNewWc] = useState({ name: '', color: '#C9A84C' });
  const [newIc, setNewIc] = useState({ name: '', color: '#2D6A4F' });

  const fetchCategories = async () => {
    const [wcRes, icRes] = await Promise.all([
      supabase.from('workshop_categories').select('*').order('name'),
      supabase.from('internship_categories').select('*').order('name'),
    ]);
    setWorkshopCats(wcRes.data ?? []);
    setInternshipCats(icRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const addWorkshopCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWc.name.trim()) return;
    setSaving(true);
    await supabase.from('workshop_categories').insert({ name: newWc.name.trim(), slug: slugify(newWc.name), color: newWc.color });
    setNewWc({ name: '', color: '#C9A84C' });
    await fetchCategories();
    setSaving(false);
    setSavedMsg('Workshop category added');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const addInternshipCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIc.name.trim()) return;
    setSaving(true);
    await supabase.from('internship_categories').insert({ name: newIc.name.trim(), slug: slugify(newIc.name), color: newIc.color });
    setNewIc({ name: '', color: '#2D6A4F' });
    await fetchCategories();
    setSaving(false);
    setSavedMsg('Internship category added');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const deleteWorkshopCat = async (id: string) => {
    await supabase.from('workshop_categories').delete().eq('id', id);
    fetchCategories();
  };

  const deleteInternshipCat = async (id: string) => {
    await supabase.from('internship_categories').delete().eq('id', id);
    fetchCategories();
  };

  const updateCatColor = async (table: 'workshop_categories' | 'internship_categories', id: string, color: string) => {
    await supabase.from(table).update({ color }).eq('id', id);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Manage platform categories and system configuration.</p>
      </div>

      {savedMsg && (
        <div className="px-4 py-3 bg-forest-600/10 border border-forest-600/30 text-forest-400 text-sm flex items-center gap-2">
          <CheckCircle size={15} /> {savedMsg}
        </div>
      )}

      <div className="flex gap-1 border-b border-dark-300">
        {[
          { key: 'categories', label: 'Categories', icon: Tag },
          { key: 'system', label: 'System Info', icon: Database },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as 'categories' | 'system')} className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === key ? 'border-gold-600 text-gold-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workshop Categories Subpanel */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Tag size={16} className="text-gold-500" /> Workshop Categories</h2>

            <form onSubmit={addWorkshopCat} className="flex gap-2 mb-5">
              <input className="input flex-1" placeholder="New category name" value={newWc.name} onChange={(e) => setNewWc({ ...newWc, name: e.target.value })} />
              <input type="color" className="w-12 h-auto bg-dark-600 border border-dark-300 cursor-pointer p-1" value={newWc.color} onChange={(e) => setNewWc({ ...newWc, color: e.target.value })} />
              <button type="submit" disabled={saving || !newWc.name.trim()} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1"><Plus size={15} /> Add</button>
            </form>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 shimmer" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {workshopCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2 px-3 bg-dark-600 border border-dark-300">
                    <input type="color" defaultValue={c.color} onBlur={(e) => updateCatColor('workshop_categories', c.id, e.target.value)} className="w-8 h-8 bg-transparent border-0 cursor-pointer p-0" />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{c.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{c.slug}</div>
                    </div>
                    <button onClick={() => deleteWorkshopCat(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
                {workshopCats.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No categories.</p>}
              </div>
            )}
          </div>

          {/* Internship Categories Subpanel */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Tag size={16} className="text-forest-400" /> Internship Categories</h2>

            <form onSubmit={addInternshipCat} className="flex gap-2 mb-5">
              <input className="input flex-1" placeholder="New category name" value={newIc.name} onChange={(e) => setNewIc({ ...newIc, name: e.target.value })} />
              <input type="color" className="w-12 h-auto bg-dark-600 border border-dark-300 cursor-pointer p-1" value={newIc.color} onChange={(e) => setNewIc({ ...newIc, color: e.target.value })} />
              <button type="submit" disabled={saving || !newIc.name.trim()} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1"><Plus size={15} /> Add</button>
            </form>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 shimmer" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {internshipCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2 px-3 bg-dark-600 border border-dark-300">
                    <input type="color" defaultValue={c.color} onBlur={(e) => updateCatColor('internship_categories', c.id, e.target.value)} className="w-8 h-8 bg-transparent border-0 cursor-pointer p-0" />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{c.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{c.slug}</div>
                    </div>
                    <button onClick={() => deleteInternshipCat(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
                {internshipCats.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No categories.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
