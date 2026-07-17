import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './StudentLayout';
import { Certificate } from '../lib/types';

export default function StudentCertificates() {
  const { student } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    supabase.from('certificates').select('*').eq('student_id', student.id).order('created_at', { ascending: false })
      .then(({ data }) => { setCertificates(data ?? []); setLoading(false); });
  }, [student]);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Certificates</h1>
          <p className="text-gray-400 text-sm">Download and share your earned certificates.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 shimmer" />)}</div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="card hover:border-gold-600/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center shrink-0">
                    <Award size={20} className="text-gold-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm mb-1 line-clamp-1">{cert.program_name}</div>
                    <div className="text-gray-500 text-xs mb-1">ID: {cert.certificate_number}</div>
                    <div className="text-gray-500 text-xs">Issued: {new Date(cert.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <span className={`badge mt-2 ${cert.status === 'active' ? 'badge-green' : 'badge-red'}`}>{cert.status}</span>
                  </div>
                </div>
                {cert.pdf_url && (
                  <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-4 text-gold-500 hover:text-gold-400 text-sm transition-colors">
                    <Download size={14} /> Download PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Award size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-gray-500 text-sm">Complete a workshop or internship to earn your first certificate!</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
