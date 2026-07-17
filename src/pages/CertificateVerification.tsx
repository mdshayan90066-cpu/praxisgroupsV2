import { useState } from 'react';
import { Search, Award, CheckCircle, XCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Certificate } from '../lib/types';
import SEO from '../components/ui/SEO';
import PublicLayout from '../components/layout/PublicLayout';

export default function CertificateVerification() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    const { data } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_number', certId.trim().toUpperCase())
      .maybeSingle();

    setCertificate(data);
    setNotFound(!data);
    setSearched(true);
    setLoading(false);
  };

  return (
    <PublicLayout>
      <SEO title="Verify Certificate — Praxis Group" description="Verify the authenticity of any Praxis Group certificate by entering its unique certificate number." />
      <div className="pt-24 pb-12 px-4 bg-dark-700/50 border-b border-dark-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Verification</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Certificate Verification</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Instantly verify the authenticity of any Praxis Group certificate using the unique certificate ID.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-24">
        <div className="card text-center mb-8">
          <div className="w-16 h-16 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} className="text-gold-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verify a Certificate</h2>
          <p className="text-gray-400 text-sm mb-8">
            Enter the Certificate ID found at the bottom of any Praxis Group certificate.
          </p>

          <form onSubmit={handleVerify} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. PRX-2024-00123"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="input flex-1 text-center uppercase tracking-widest"
            />
            <button type="submit" disabled={loading || !certId.trim()} className="btn-primary px-6 flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-dark-800/40 border-t-dark-800 rounded-full animate-spin" /> : <Search size={16} />}
              {loading ? '' : 'Verify'}
            </button>
          </form>
        </div>

        {searched && certificate && (
          <div className="card border-forest-600/40 animate-slide-up">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dark-300">
              <div className="w-12 h-12 bg-forest-600/20 border border-forest-600/30 flex items-center justify-center">
                <CheckCircle size={22} className="text-forest-400" />
              </div>
              <div>
                <div className="text-forest-400 font-semibold">Certificate Verified</div>
                <div className="text-gray-500 text-sm">This is an authentic Praxis Group certificate</div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Certificate ID', value: certificate.certificate_number },
                { label: 'Student Name', value: certificate.student_name },
                { label: 'Program', value: certificate.program_name },
                { label: 'Program Type', value: certificate.program_type === 'workshop' ? 'Workshop' : 'Internship' },
                { label: 'Issue Date', value: new Date(certificate.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Status', value: certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dark-300 last:border-0">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className={`font-medium text-sm ${label === 'Status' && certificate.status !== 'active' ? 'text-red-400' : 'text-white'}`}>{value}</span>
                </div>
              ))}
            </div>
            {certificate.pdf_url && (
              <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-center mt-6 py-3 text-sm block">
                Download Certificate PDF
              </a>
            )}
          </div>
        )}

        {searched && notFound && (
          <div className="card border-red-600/30 animate-slide-up text-center py-10">
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Certificate Not Found</h3>
            <p className="text-gray-400 text-sm">
              No certificate found with ID "{certId}". Please check the ID and try again.
            </p>
          </div>
        )}

        <div className="mt-12 p-6 bg-dark-700/50 border border-dark-300">
          <div className="flex items-start gap-3">
            <Award size={18} className="text-gold-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-white font-medium mb-1 text-sm">How to Find Your Certificate ID</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your Certificate ID is printed at the bottom of your certificate in the format PRX-YYYY-NNNNN. You can also find it in your student dashboard under "Certificates".
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
