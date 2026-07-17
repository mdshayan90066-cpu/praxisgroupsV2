import { Calendar, Clock, Monitor, Users, Tag } from 'lucide-react';
import { Workshop } from '../../lib/types';
import { Link } from '../../router';

interface Props {
  workshop: Workshop;
}

export default function WorkshopCard({ workshop }: Props) {
  const isExpired = workshop.registration_deadline
    ? new Date(workshop.registration_deadline) < new Date()
    : false;

  return (
    <Link to={`/workshops/${workshop.slug}`} className="block">
      <div className="group h-full flex flex-col cursor-pointer bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden bg-[var(--bg-muted)]">
          {workshop.thumbnail_url ? (
            <img
              src={workshop.thumbnail_url}
              alt={workshop.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-muted)] to-[var(--bg-subtle)]">
              <span className="text-5xl font-bold text-[var(--accent-primary)] opacity-20">{workshop.name[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              workshop.price_type === 'free'
                ? 'bg-[var(--color-success)] text-[var(--success-on)]'
                : 'bg-[var(--accent-primary)] text-[var(--accent-on)]'
            }`}>
              {workshop.price_type === 'free' ? 'Free' : `₹${workshop.price?.toLocaleString()}`}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full ${
              isExpired
                ? 'bg-[var(--color-error)] text-[var(--error-on)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
            }`}>
              {isExpired ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {workshop.workshop_categories && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <Tag size={12} className="text-[var(--accent-primary)]" />
              <span className="text-xs text-[var(--accent-primary)] font-medium uppercase tracking-wider">
                {workshop.workshop_categories.name}
              </span>
            </div>
          )}

          <h3 className="text-[var(--text-primary)] font-semibold text-base leading-snug mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
            {workshop.name}
          </h3>

          {workshop.description && (
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
              {workshop.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--surface-border)] mt-auto">
            {workshop.duration && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Clock size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">{workshop.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                <Monitor size={13} className="text-[var(--text-muted)]" />
              </div>
              <span className="text-[var(--text-tertiary)] text-xs capitalize">{workshop.workshop_type}</span>
            </div>
            {workshop.seats_available !== null && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Users size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">{workshop.seats_available} seats</span>
              </div>
            )}
            {workshop.registration_deadline && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center">
                  <Calendar size={13} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-tertiary)] text-xs">
                  {new Date(workshop.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
