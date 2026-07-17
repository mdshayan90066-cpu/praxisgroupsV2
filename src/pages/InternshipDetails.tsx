import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Award, Briefcase, CheckCircle, IndianRupee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Internship } from '../lib/types';
import PublicLayout from '../components/layout/PublicLayout';
import { useParams, useNavigate } from '../router';
import ApplicationFormModal from '../components/ui/ApplicationFormModal';

export default function InternshipDetails() {
  const { _path } = useParams();
  const slug = _path.split('/').pop() ?? '';
  const navigate = useNavigate();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('internships')
      .select('*, internship_categories!internships_category_id_fkey(*), companies(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching internship details:", error);
        }
        setInternship(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-16 min-h-screen">
          <div className="h-72 shimmer" />
          <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
            <div className="h-8 w-2/3 shimmer" />
            <div className="h-4 w-full shimmer" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!internship) {
    return (
      <PublicLayout>
        <div className="pt-32 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Internship Not Found</h2>
          <button onClick={() => navigate('/internships')} className="btn-primary px-6 py-3">Back to Internships</button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="pt-16 relative">
        <div className="aspect-[21/5] bg-dark-600 overflow-hidden">
          {internship.banner_url || internship.thumbnail_url ? (
            <img src={internship.banner_url || internship.thumbnail_url!} alt={internship.name} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/40 to-transparent" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-24">
        <button onClick={() => navigate('/internships')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Internships
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {internship.internship_categories && (
              <span className="badge badge-green">{internship.internship_categories.name}</span>
            )}

            <div className="flex items-start gap-4">
              {internship.company_logo_url && (
                <div className="w-16 h-16 bg-dark-600 border border-dark-300 p-2 shrink-0">
                  <img src={internship.company_logo_url} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{internship.name}</h1>
                <p className="text-gold-500 font-medium">{internship.partner_company_name || internship.companies?.name}</p>
              </div>
            </div>

            {internship.description && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">About This Internship</h2>
                <p className="text-gray-400 leading-relaxed">{internship.description}</p>
              </div>
            )}

            {internship.roles && internship.roles.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Roles</h2>
                <ul className="space-y-2">
                  {internship.roles.map((r, i) => <li key={i} className="flex items-start gap-3 text-gray-400 text-sm"><span className="text-gold-600 mt-0.5">•</span> {r}</li>)}
                </ul>
              </div>
            )}

            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Responsibilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {internship.responsibilities.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-forest-500 mt-0.5 shrink-0" />
                      <span className="text-gray-300 text-sm">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {internship.skills_required && internship.skills_required.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {internship.skills_required.map((s) => (
                    <span key={s} className="px-3 py-1 bg-dark-600 border border-dark-300 text-gray-300 text-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {internship.eligibility && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Eligibility</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{internship.eligibility}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="card sticky top-20 border-gold-600/20 space-y-4">
              <div className="space-y-3 pb-5 border-b border-dark-300">
                {internship.stipend_type === 'paid' && internship.stipend_amount && (
                  <div className="flex items-center gap-3 text-sm">
                    <IndianRupee size={15} className="text-gold-500" />
                    <span className="text-white font-semibold">₹{internship.stipend_amount.toLocaleString()}/month</span>
                  </div>
                )}
                {internship.duration && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase size={15} className="text-gray-500" />
                    <span className="text-gray-300">{internship.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-gray-500" />
                  <span className="text-gray-300 capitalize">{internship.work_mode}{internship.location ? ` — ${internship.location}` : ''}</span>
                </div>
                {internship.number_of_openings !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={15} className="text-gray-500" />
                    <span className="text-gray-300">{internship.number_of_openings} openings</span>
                  </div>
                )}
                {internship.certificate_provided && (
                  <div className="flex items-center gap-3 text-sm">
                    <Award size={15} className="text-gold-500" />
                    <span className="text-gray-300">Certificate provided</span>
                  </div>
                )}
                {internship.application_end_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-red-400" />
                    <span className="text-gray-300">Closes: {new Date(internship.application_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {applied ? (
                <div className="text-center py-3 bg-forest-600/20 border border-forest-600/30 text-forest-400 text-sm font-medium">
                  Application Submitted!
                </div>
              ) : (
                <button onClick={() => setShowApplyModal(true)} className="btn-primary w-full py-3.5 text-sm">
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationFormModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        type="internship"
        programId={internship.id}
        programName={internship.name}
        onSuccess={() => setApplied(true)}
      />
    </PublicLayout>
  );
}
