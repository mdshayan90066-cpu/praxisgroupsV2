import { useEffect, useState } from 'react';
import { Target, Eye, Heart, Users, Building2, Award, BookOpen } from 'lucide-react';
import SEO from '../components/ui/SEO';
import PublicLayout from '../components/layout/PublicLayout';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  display_order: number;
}

export default function About() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_visible', true)
        .order('display_order');
      
      if (error) {
        console.error('Error fetching team members:', error);
      }
      setTeam(data ?? []);
      setLoading(false);
    };
    fetchTeam();
  }, []);

  return (
    <PublicLayout>
      <SEO title="About Us — Praxis Group" description="Learn about Praxis Group's mission to bridge the gap between education and industry through expert-led workshops, internships, and collaborations." />
      <div className="pt-24 pb-12 px-4 bg-dark-700/50 border-b border-dark-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Our Story</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Praxis Group</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Founded with a mission to bridge the gap between academia and industry, Praxis Group has become India's trusted EdTech platform.
          </p>
        </div>
      </div>

      {/* Mission/Vision/Values */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { icon: Target, title: 'Our Mission', color: 'gold', desc: 'To democratize access to world-class professional education and create meaningful pathways between students and industry.' },
              { icon: Eye, title: 'Our Vision', color: 'forest', desc: 'A world where every student has the skills, mentorship, and network to build a career they are proud of.' },
              { icon: Heart, title: 'Our Values', color: 'gold', desc: 'Excellence, integrity, inclusivity, and a relentless commitment to student outcomes drive everything we do.' },
            ].map(({ icon: Icon, title, color, desc }) => (
              <div key={title} className="card border-t-2 border-gold-600">
                <div className={`w-12 h-12 ${color === 'gold' ? 'bg-gold-600/10 border-gold-600/20' : 'bg-forest-600/10 border-forest-600/20'} border flex items-center justify-center mb-5`}>
                  <Icon size={20} className={color === 'gold' ? 'text-gold-500' : 'text-forest-400'} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              { icon: Users, value: '5,000+', label: 'Students Trained' },
              { icon: Building2, value: '120+', label: 'Partner Companies' },
              { icon: BookOpen, value: '80+', label: 'Programs Delivered' },
              { icon: Award, value: '12,000+', label: 'Certificates Issued' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="card text-center">
                <Icon size={24} className="text-gold-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-gray-500 text-sm">{label}</div>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Our Journey</div>
              <h2 className="text-3xl font-bold text-white mb-6">Built by Educators, Backed by Industry</h2>
              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                <p>
                  Praxis Group was founded in 2020 by a team of educators and industry professionals who recognized a critical gap: students graduating with theoretical knowledge but lacking the practical skills that employers demand.
                </p>
                <p>
                  We started with a single workshop in New Delhi, serving 30 students. Today, we operate across 15 cities, partner with 120+ companies, and have helped thousands of students land their dream jobs.
                </p>
                <p>
                  Our approach is different. Every program we design involves direct input from hiring managers, ensuring that what you learn in our workshops and internships translates directly to workplace success.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Team" className="w-full aspect-square object-cover" />
              <img src="https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Workshop" className="w-full aspect-square object-cover mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-4 bg-dark-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Leadership</div>
            <h2 className="section-title">Meet Our Team</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 shimmer rounded-2xl" />)}
            </div>
          ) : team.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.id} className="card-hover text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 overflow-hidden border-2 border-dark-300 group-hover:border-gold-600 transition-colors rounded-full">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dark-600 text-gold-500 text-2xl font-semibold">
                        {member.name[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="text-white font-semibold text-sm">{member.name}</div>
                  <div className="text-gold-600 text-xs mt-1">{member.role}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Team members will appear here soon.</p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
