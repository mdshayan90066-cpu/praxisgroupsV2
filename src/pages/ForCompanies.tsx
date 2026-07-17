import { useState } from 'react';
import { Building2, Users, Handshake, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import { supabase } from '../lib/supabase';

const benefits = [
  { icon: Users, title: 'Access Top Talent', desc: 'Connect with pre-screened, industry-ready students from 200+ colleges across India.' },
  { icon: TrendingUp, title: 'Build Your Brand', desc: 'Position your company as an employer of choice among emerging professionals.' },
  { icon: Handshake, title: 'Custom Programs', desc: 'Co-design internship programs tailored to your specific business needs and culture.' },
  { icon: Building2, title: 'Zero Hiring Cost', desc: 'Reduce recruitment costs by hiring interns who have been trained on your requirements.' },
];

const requestTypes = [
  { value: 'partnership', label: 'Strategic Partnership' },
  { value: 'hire_interns', label: 'Hire Interns' },
  { value: 'collaboration', label: 'Program Collaboration' },
];

export default function ForCompanies() {
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', website: '', industry: '', message: '', request_type: 'partnership' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('company_partnership_requests').insert(form);
    if (err) setError('Failed to submit request. Please try again.');
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="pt-24 pb-12 px-4 bg-dark-700/50 border-b border-dark-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-forest-400 text-sm font-semibold uppercase tracking-wider mb-3">Partnerships</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Partner With Praxis Group</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Join 120+ companies that trust Praxis Group to identify, train, and deliver industry-ready talent.
          </p>
        </div>
      </div>

      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover group">
                <div className="w-12 h-12 bg-forest-600/10 border border-forest-600/20 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-forest-400" />
                </div>
                <h3 className="text-white font-semibold mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">How We Work With Companies</h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Submit Partnership Request', desc: 'Fill out the form with your company details and requirements.' },
                  { step: '02', title: 'Discovery Call', desc: 'Our team will reach out within 48 hours to understand your needs.' },
                  { step: '03', title: 'Program Design', desc: 'We co-design an internship or collaboration program tailored to your company.' },
                  { step: '04', title: 'Talent Delivery', desc: 'Receive pre-screened candidates who meet your specific requirements.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-10 h-10 bg-dark-700 border border-gold-600/40 text-gold-500 text-sm font-bold flex items-center justify-center shrink-0">
                      {step}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{title}</h4>
                      <p className="text-gray-400 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-dark-700/50 border border-dark-300">
                <h3 className="text-white font-semibold mb-3">What Our Partners Say</h3>
                <blockquote className="text-gray-400 text-sm leading-relaxed italic mb-4">
                  "Praxis Group consistently delivers motivated, skilled interns who require minimal onboarding time. It's the most efficient talent pipeline we've used."
                </blockquote>
                <div className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-forest-500" />
                  <span className="text-gray-500 text-sm">HR Director, Leading Fintech Company</span>
                </div>
              </div>
            </div>

            <div>
              {success ? (
                <div className="card border-forest-600/30 text-center py-12">
                  <CheckCircle size={48} className="text-forest-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                  <p className="text-gray-400 text-sm">Our partnerships team will contact you within 48 hours.</p>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-xl font-bold text-white mb-6">Submit Partnership Request</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Company Name *</label>
                        <input required className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Contact Person *</label>
                        <input required className="input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Business Email *</label>
                      <input required type="email" className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Phone</label>
                        <input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Website</label>
                        <input className="input" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Industry</label>
                      <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Request Type *</label>
                      <select required className="input" value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}>
                        {requestTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Message</label>
                      <textarea rows={4} className="input resize-none" placeholder="Tell us about your requirements..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group">
                      {loading ? 'Submitting...' : <>Submit Request <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
