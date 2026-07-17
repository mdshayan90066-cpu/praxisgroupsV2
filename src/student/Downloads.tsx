import { useEffect, useState } from 'react';
import { Download, AlertCircle, FileText, Award, ExternalLink, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';
import { Certificate } from '../lib/types';

interface ResourceItem {
  title: string;
  url: string;
  type?: string;
}
interface EnrolledWorkshop {
  id: string;
  workshops: { name: string; resources: Record<string, unknown> | null } | null;
}

export default function Downloads() {
  const { student } = useAuth();
  const [resources, setResources] = useState<{ workshopName: string; items: ResourceItem[] }[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const [wRes, cRes] = await Promise.all([
        supabase.from('workshop_applications').select('id, workshops(name, resources)').eq('student_id', student.id).in('status', ['accepted', 'completed', 'paid']),
        supabase.from('certificates').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
      ]);
      if (wRes.error || cRes.error) { setError(wRes.error?.message || cRes.error?.message || 'Failed to load'); setLoading(false); return; }

      // Parse resources JSONB from each enrolled workshop
      const parsed = (wRes.data as unknown as EnrolledWorkshop[] ?? [])
        .map(a => {
          const w = a.workshops;
          const raw = w?.resources;
          let items: ResourceItem[] = [];
          if (Array.isArray(raw)) items = raw as ResourceItem[];
          else if (raw && typeof raw === 'object') items = Object.values(raw) as ResourceItem[];
          return { workshopName: w?.name ?? 'Unknown', items: items.filter(i => i?.url) };
        })
        .filter(g => g.items.length > 0);

      setResources(parsed);
      setCertificates(cRes.data ?? []);
      setLoading(false);
    })();
  }, [student]);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Downloads</h1>
          <p className="text-gray-400 text-sm">Access resources from your workshops and download certificates.</p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 shimmer" />)}</div>
        ) : resources.length === 0 && certificates.length === 0 ? (
          <div className="card text-center py-16">
            <FolderOpen size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Downloads Available</h3>
            <p className="text-gray-500 text-sm">Resources and certificates from your enrolled programs will appear here.</p>
          </div>
        ) : (
          <>
            {/* Workshop Resources */}
            {resources.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2"><FileText size={16} className="text-gold-500" /> Workshop Resources</h2>
                {resources.map((group, gi) => (
                  <div key={gi} className="card">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">{group.workshopName}</div>
                    <div className="space-y-2">
                      {group.items.map((item, ii) => (
                        <a key={ii} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-3 bg-dark-600 border border-dark-300 hover:border-gold-600/30 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={14} className="text-gray-500 group-hover:text-gold-500 shrink-0" />
                            <span className="text-white text-sm truncate">{item.title || `Resource ${ii + 1}`}</span>
                            {item.type && <span className="badge badge-gray">{item.type}</span>}
                          </div>
                          <Download size={14} className="text-gold-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2"><Award size={16} className="text-gold-500" /> Certificates</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="card hover:border-gold-600/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <Award size={18} className="text-gold-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium line-clamp-1">{cert.program_name}</div>
                          <div className="text-gray-500 text-xs">{cert.certificate_number}</div>
                        </div>
                      </div>
                      {cert.pdf_url ? (
                        <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-4 text-gold-500 hover:text-gold-400 text-sm transition-colors">
                          <ExternalLink size={14} /> Download PDF
                        </a>
                      ) : (
                        <div className="text-gray-600 text-xs mt-4">PDF not available yet</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
