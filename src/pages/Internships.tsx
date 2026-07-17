import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../router';
import { Briefcase, Building2 } from 'lucide-react';
import type { Internship } from '../lib/types';

export default function Internships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInternships() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('internships')
          .select('*')
          .eq('status', 'open');
        setInternships(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInternships();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Available Internships</h1>
        <p className="text-[var(--text-muted)] mt-2">Explore premier industry placement programs.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fixed explicit array loop mapping */}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 rounded-2xl bg-[var(--card-bg)] animate-pulse border border-[var(--card-border)]" />
          ))}
        </div>
      ) : internships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {internships.map((item) => (
            <div key={item.id} className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-2">
                  <Building2 size={14} /> <span>{item.partner_company_name}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/internships/${item.slug}`)} 
                className="mt-6 w-full py-2.5 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-xl text-center"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
          <Briefcase className="mx-auto text-[var(--text-muted)] mb-3" size={32} />
          <p className="text-[var(--text-muted)] text-sm">No active internships found at the moment.</p>
        </div>
      )}
    </div>
  );
}
