import { BookOpen } from 'lucide-react';
import SEO from '../components/ui/SEO';
import PublicLayout from '../components/layout/PublicLayout';

export default function Resources() {
  return (
    <PublicLayout>
      <SEO title="Resources — Praxis Group" description="Praxis Group resources — coming soon." />
      <div className="pt-24 pb-12 px-4 bg-dark-700/50 border-b border-dark-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Resources</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Resources</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Our resource library is being curated. Check back soon for guides, templates, and learning materials.
          </p>
        </div>
      </div>

      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center">
            <BookOpen size={24} className="text-gold-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Coming Soon</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We're putting together a curated collection of resources to support your learning journey. Please visit again later.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
