import { Calendar, MapPin, Briefcase, Users, Tag } from 'lucide-react';
import { Internship } from '../../lib/types';
import { Link } from '../../router';

interface Props {
  internship: Internship;
}

export default function InternshipCard({ internship }: Props) {
  const companyName = internship.partner_company_name || internship.companies?.name || 'Praxis Group';

  return (
    <Link to={`/internships/${internship.slug}`} className="block">
      <div className="group h-full flex flex-col cursor-pointer bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden bg-[var(--bg-muted)]">
          {internship.thumbnail_url ? (
            <img
              src={internship.thumbnail_url}
              alt={internship.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-muted)] to-[var(--bg-subtle)]">
              {internship.company_logo_url ? (
                <img src={internship.company_logo_url} alt="" className="w-16 h-16 object-contain opacity-50" />
              ) : (
                <span className="text-5xl font-bold text-[var(--accent-secondary)] opacity-20">{internship.name[0]}</span>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              internship.stipend_type === 'paid'
                ? 'bg-[var(--color-success)] text-[var(--success-on)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
            }`}>
              {internship.stipend_type === 'paid'
                ? `₹${internship.stipend_amount?.toLocaleString()}/mo`
                : 'Unpaid'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {internship.internship_categories && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <Tag size={12} className="text-[var(--accent-secondary)]" />
              <span className="text-xs text-[var(--accent-secondary)] font-medium uppercase tracking-wider">
                {internship.internship_categories.name}
              </span>
            </div>
          )}

          <h3 className="text-[var(--text-primary)] font-semibold text-base leading-snug mb-1 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
            {internship.name}
          </h3>

          <p className="text-[var(--accent-primary)] text-sm font-medium mb-3">
            {companyName}
          </p>

          {internship.description && (
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
              {internship.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--surface-border)] mt-auto">
            {internship.duration && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Briefcase size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">{internship.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                <MapPin size={13} className="text-[var(--text-muted)]" />
              </div>
              <span className="text-[var(--text-tertiary)] text-xs capitalize">{internship.work_mode?.replace('-', ' ')}</span>
            </div>
            {internship.number_of_openings !== null && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Users size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">{internship.number_of_openings} openings</span>
              </div>
            )}
            {internship.application_end_date && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Calendar size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">
                  {new Date(internship.application_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
