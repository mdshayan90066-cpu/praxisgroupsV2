import { useEffect, useState } from 'react';
import { ArrowRight, Award, Users, Building2, BookOpen, CheckCircle, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workshop, Internship } from '../lib/types';
import SEO from '../components/ui/SEO';
import WorkshopCard from '../components/workshop/WorkshopCard';
import InternshipCard from '../components/internship/InternshipCard';
import PublicLayout from '../components/layout/PublicLayout';
import PremiumBackground from '../components/ui/PremiumBackground';
import { Link } from '../router';

const stats = [
  { icon: Users, value: '5,000+', label: 'Students Trained' },
  { icon: Building2, value: '120+', label: 'Partner Companies' },
  { icon: BookOpen, value: '80+', label: 'Workshops Delivered' },
  { icon: Award, value: '12,000+', label: 'Certificates Issued' },
];

const process = [
  { step: '01', title: 'Explore', desc: 'Browse our curated workshops and internships tailored to your career goals.' },
  { step: '02', title: 'Apply', desc: 'Submit your application in minutes with our streamlined registration process.' },
  { step: '03', title: 'Learn', desc: 'Engage with industry experts through live sessions, projects, and mentorship.' },
  { step: '04', title: 'Certify', desc: 'Earn a verified certificate recognized across 120+ companies nationwide.' },
];

const faqs = [
  { q: 'What types of programs does Praxis Group offer?', a: 'We offer professional workshops, industry internships, company collaboration programs, and certificate courses spanning technology, business, design, marketing, and finance.' },
  { q: 'Are the certificates recognized by employers?', a: 'Yes. Praxis Group certificates are recognized by 120+ partner companies. Every certificate includes a unique ID that can be verified online through our certificate verification portal.' },
  { q: 'How do I apply for an internship?', a: 'Create a student account, browse our active internships, and click Apply on any listing. You can track your application status from your dashboard in real time.' },
  { q: 'Are there free workshops available?', a: 'Yes, we offer both free and paid workshops. Free workshops are available for select programs and community events. Check the Workshops page for current listings.' },
  { q: 'How can my company partner with Praxis Group?', a: 'Visit our For Companies page and submit a partnership request. Our team will get in touch within 48 hours to discuss collaboration opportunities.' },
];

const testimonials = [
  { name: 'Ananya Sharma', role: 'Software Engineer at TCS', text: 'The Python workshop at Praxis was a game-changer. The curriculum was practical, the instructor was world-class, and I landed my first job within 3 months.' },
  { name: 'Rohan Mehta', role: 'Marketing Lead at Razorpay', text: 'I completed the Digital Marketing internship through Praxis Group. The real-world projects gave me the portfolio that got me hired at a fintech unicorn.' },
  { name: 'Priya Nair', role: 'Finance Analyst at HDFC', text: 'Praxis Group connected me with industry mentors who guided my career transition from commerce to fintech. Exceptional program, exceptional people.' },
];

interface Collaboration {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

export default function Home() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [wRes, iRes, cRes] = await Promise.all([
        supabase.from('workshops').select('*, workshop_categories!workshops_category_id_fkey(*)').eq('status', 'active').limit(3),
        supabase.from('internships').select('*, internship_categories!internships_category_id_fkey(*), companies(*)').eq('status', 'open').limit(3),
        supabase.from('companies').select('id, name, logo_url, website').order('name'),
      ]);
      setWorkshops(wRes.data ?? []);
      setInternships(iRes.data ?? []);
      setCollaborations(cRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <PublicLayout>
      <SEO title="Praxis Group — Workshops, Internships & Industry Collaborations" description="Praxis Group offers industry-led workshops, internships, and collaborations. Learn from experts, gain real-world experience, and earn verified certificates." />

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-44 pb-24">
        {/* Premium embossed background */}
        <PremiumBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
            Elevate Your Career with{' '}
            <span className="bg-gradient-to-r from-[#E2B96F] via-[#C89A4B] to-[#A87C38] bg-clip-text text-transparent">
              Industry-Ready
            </span>{' '}
            Skills
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-[rgba(255,255,255,0.55)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 5,000+ students who accelerated their careers through Praxis Group's world-class workshops, real-world internships, and industry-recognized certificates.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              to="/workshops"
              className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl group"
              style={{
                background: 'linear-gradient(135deg, #C89A4B 0%, #A87C38 100%)',
                color: '#0e0e0e',
                boxShadow: '0 0 0 1px rgba(200,154,75,0.3), 0 8px 32px rgba(200,154,75,0.2)',
              }}
            >
              Explore Workshops
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/internships"
              className="inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl transition-all duration-200"
              style={{
                border: '1px solid rgba(200,154,75,0.3)',
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(200,154,75,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              Browse Internships
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{
                    background: 'rgba(200,154,75,0.1)',
                    border: '1px solid rgba(200,154,75,0.2)',
                  }}
                >
                  <Icon size={20} style={{ color: '#C89A4B' }} />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-[rgba(255,255,255,0.45)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED WORKSHOPS ========== */}
      <section className="py-24 px-6 bg-[var(--bg-muted)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 block">Programs</span>
              <h2 className="section-title">Featured Workshops</h2>
            </div>
            <Link to="/workshops" className="hidden sm:flex items-center gap-2 text-[var(--accent-primary)] text-sm font-medium hover:text-[var(--accent-primary-hover)] transition-colors group">
              View All
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <div key={i} className="h-[400px] shimmer rounded-2xl" />)}
            </div>
          ) : workshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {workshops.map((w) => <WorkshopCard key={w.id} workshop={w} />)}
            </div>
          ) : (
            <div className="text-center py-20 card">
              <BookOpen size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-tertiary)]">No workshops available yet. Check back soon.</p>
            </div>
          )}

          <div className="mt-8 sm:hidden text-center">
            <Link to="/workshops" className="btn-secondary px-6 py-3 text-sm">View All Workshops</Link>
          </div>
        </div>
      </section>

      {/* ========== FEATURED INTERNSHIPS ========== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm font-semibold text-[var(--color-forest-400)] uppercase tracking-wider mb-3 block">Opportunities</span>
              <h2 className="section-title">Featured Internships</h2>
            </div>
            <Link to="/internships" className="hidden sm:flex items-center gap-2 text-[var(--accent-primary)] text-sm font-medium hover:text-[var(--accent-primary-hover)] transition-colors group">
              View All
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <div key={i} className="h-[360px] shimmer rounded-2xl" />)}
            </div>
          ) : internships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {internships.map((i) => <InternshipCard key={i.id} internship={i} />)}
            </div>
          ) : (
            <div className="text-center py-20 card">
              <Building2 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-tertiary)]">No internships available yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 px-6 bg-[var(--bg-muted)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[var(--color-forest-400)] uppercase tracking-wider mb-3 block">How It Works</span>
            <h2 className="section-title">Your Journey to Success</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {process.map(({ step, title, desc }, index) => (
              <div key={step} className="relative">
                <div className="card h-full hover:border-[var(--surface-border-hover)] transition-all">
                  <div className="text-5xl font-bold text-[var(--accent-primary-muted)] mb-6">{step}</div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
                  <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">{desc}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight size={20} className="text-[var(--surface-border)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE PRAXIS ========== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 block">Why Us</span>
            <h2 className="section-title">Why Choose Praxis Group</h2>
            <p className="section-subtitle mx-auto max-w-2xl">We don't just teach — we prepare you for the real world through hands-on learning, industry mentors, and career-grade certifications.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Industry-Led Curriculum', desc: 'Our programs are co-designed with 120+ industry partners, ensuring you learn skills that employers actually need.' },
              { icon: Users, title: 'Expert Mentors', desc: 'Learn directly from industry practitioners with 10+ years of experience at top companies.' },
              { icon: Award, title: 'Verified Certificates', desc: 'Every certificate comes with a unique verification ID, QR code, and is recognized across our partner network.' },
              { icon: Building2, title: 'Real-World Projects', desc: 'Work on live projects for real companies during internships. Graduate with a portfolio that stands out.' },
              { icon: Star, title: 'Career Support', desc: 'Get placement assistance, resume reviews, mock interviews, and referrals to our hiring partners.' },
              { icon: CheckCircle, title: 'Flexible Learning', desc: 'Choose from online, offline, and hybrid programs that fit your schedule and learning style.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-hover group">
                <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary-muted)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent-primary-subtle)] transition-colors">
                  <Icon size={24} className="text-[var(--accent-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
                <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-24 px-6 bg-[var(--bg-muted)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 block">Testimonials</span>
            <h2 className="section-title">Student Success Stories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(({ name, role, text }) => (
              <div key={name} className="card relative">
                <div className="absolute top-0 left-0 w-16 h-16 -translate-x-1/4 -translate-y-1/4">
                  <svg viewBox="0 0 24 24" fill="var(--accent-primary-muted)" className="w-full h-full opacity-30">
                    <path d="M14.017 21L14.017 14.899H10.059V11.941H14.017V8.077C14.017 5.613 15.422 4 18.083 4C19.917 4 21.017 4.3 21.017 4.3V8.1H19.417C18.017 8.1 17.017 9 17.017 10.5V11.941H21.017L20.017 14.899H17.017V21H14.017Z" />
                  </svg>
                </div>
                <div className="flex gap-1 mb-4 pt-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="text-[var(--accent-primary)]" fill="var(--accent-primary)" />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--surface-border)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-muted)] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[var(--accent-primary)]">{name[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] text-sm">{name}</div>
                    <div className="text-[var(--accent-primary)] text-xs">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== INDUSTRY COLLABORATIONS ========== */}
      {collaborations.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <span className="text-sm font-semibold text-[var(--color-forest-400)] uppercase tracking-wider mb-3 block">Partners</span>
            <h2 className="section-title mb-4">Industry Collaborations</h2>
            <p className="text-[var(--text-tertiary)] mb-12 max-w-xl mx-auto">Trusted by leading companies across technology, finance, and consulting sectors.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {collaborations.map((co) => {
                const inner = (
                  <div className="card flex flex-col items-center justify-center py-6 px-4 h-24 hover:border-[var(--surface-border-hover)] transition-colors">
                    {co.logo_url ? (
                      <img src={co.logo_url} alt={co.name} className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" />
                    ) : (
                      <span className="text-[var(--text-tertiary)] text-sm font-medium text-center leading-snug">{co.name}</span>
                    )}
                  </div>
                );
                return co.website ? (
                  <a key={co.id} href={co.website} target="_blank" rel="noopener noreferrer" className="block no-underline">
                    {inner}
                  </a>
                ) : (
                  <div key={co.id}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========== FAQ ========== */}
      <section className="py-24 px-6 bg-[var(--bg-muted)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 block">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="card p-0 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[var(--bg-interactive)] transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)] pr-4">{q}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${openFaq === i ? 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[var(--text-tertiary)] text-sm leading-relaxed border-t border-[var(--surface-border)] pt-4 animate-slide-up">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-glass text-center p-12 md:p-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Ready to Elevate Your Career?
            </h2>
            <p className="text-[var(--text-tertiary)] text-lg mb-10 max-w-xl mx-auto">
              Join thousands of students already transforming their careers with Praxis Group's industry-led programs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary px-10 py-4 text-base flex items-center gap-3 group">
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/for-companies" className="btn-secondary px-10 py-4 text-base">
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
