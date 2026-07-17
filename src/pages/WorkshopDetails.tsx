import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Monitor, Users, Award, CheckCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workshop } from '../lib/types';
import PublicLayout from '../components/layout/PublicLayout';
import { useParams, useNavigate } from '../router';
import ApplicationFormModal from '../components/ui/ApplicationFormModal';

export default function WorkshopDetails() {
  const { _path } = useParams();
  const slug = _path.split('/').pop() ?? '';
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('workshops')
      .select('*, workshop_categories!workshops_category_id_fkey(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setWorkshop(data);
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
            <div className="h-4 w-3/4 shimmer" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!workshop) {
    return (
      <PublicLayout>
        <div className="pt-32 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Workshop Not Found</h2>
          <button onClick={() => navigate('/workshops')} className="btn-primary px-6 py-3">Back to Workshops</button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Banner */}
      <div className="pt-16 relative">
        <div className="aspect-[21/6] bg-dark-600 overflow-hidden">
          {workshop.banner_url || workshop.thumbnail_url ? (
            <img
              src={workshop.banner_url || workshop.thumbnail_url!}
              alt={workshop.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-24">
        <button
          onClick={() => navigate('/workshops')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Workshops
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {workshop.workshop_categories && (
              <span className="badge badge-gold">{workshop.workshop_categories.name}</span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{workshop.name}</h1>

            {workshop.description && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">About This Workshop</h2>
                <p className="text-gray-400 leading-relaxed">{workshop.description}</p>
              </div>
            )}

            {workshop.learning_outcomes && workshop.learning_outcomes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workshop.learning_outcomes.map((outcome, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-gold-500 mt-0.5 shrink-0" />
                      <span className="text-gray-300 text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workshop.requirements && workshop.requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {workshop.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                      <span className="text-gold-600 mt-0.5">•</span> {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {workshop.instructor_name && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Instructor</h2>
                <div className="flex items-center gap-4 p-4 bg-dark-700 border border-dark-300">
                  <div className="w-14 h-14 bg-dark-600 overflow-hidden flex items-center justify-center border border-dark-200">
                    {workshop.instructor_image_url ? (
                      <img src={workshop.instructor_image_url} alt={workshop.instructor_name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{workshop.instructor_name}</div>
                    <div className="text-gray-500 text-sm">Workshop Instructor</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card sticky top-20 border-gold-600/20">
              <div className="text-2xl font-bold text-white mb-1">
                {workshop.price_type === 'free' ? (
                  <span className="text-forest-400">Free</span>
                ) : (
                  `₹${workshop.price?.toLocaleString()}`
                )}
              </div>

              <div className="space-y-3 my-5 pb-5 border-b border-dark-300">
                {workshop.duration && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={15} className="text-gray-500" />
                    <span className="text-gray-300">{workshop.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Monitor size={15} className="text-gray-500" />
                  <span className="text-gray-300 capitalize">{workshop.workshop_type}</span>
                </div>
                {workshop.seats_available !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={15} className="text-gray-500" />
                    <span className="text-gray-300">{workshop.seats_available} seats available</span>
                  </div>
                )}
                {workshop.certificate_available && (
                  <div className="flex items-center gap-3 text-sm">
                    <Award size={15} className="text-gold-500" />
                    <span className="text-gray-300">Certificate included</span>
                  </div>
                )}
                {workshop.commencement_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-gray-500" />
                    <span className="text-gray-300">Starts {new Date(workshop.commencement_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {workshop.registration_deadline && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-red-400" />
                    <span className="text-gray-300">Deadline: {new Date(workshop.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {applied ? (
                <div className="text-center py-3 bg-forest-600/20 border border-forest-600/30 text-forest-400 text-sm font-medium">
                  Successfully Registered!
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="btn-primary w-full py-3.5 text-sm"
                >
                  {workshop.price_type === 'free' ? 'Register for Free' : 'Proceed to Payment'}
                </button>
              )}
              <p className="text-gray-600 text-xs text-center mt-3">No spam. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationFormModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        type="workshop"
        programId={workshop.id}
        programName={workshop.name}
        price={workshop.price}
        currency={workshop.currency}
        priceType={workshop.price_type}
        onSuccess={() => setApplied(true)}
      />
    </PublicLayout>
  );
}
