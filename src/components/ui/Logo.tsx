import { Link } from '../../router';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

const logoSrc = '/assets/images/Screenshot_2026-07-05_at_18.49.35.png';

export default function Logo({ className = '', size = 'md', linkTo = '/' }: LogoProps) {
  const sizes = {
    sm: { dim: 32, text: 'text-lg' },
    md: { dim: 40, text: 'text-xl' },
    lg: { dim: 56, text: 'text-2xl' },
  };

  const { dim, text } = sizes[size];

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo mark: crop to the small version in bottom-right of the source image */}
      <div
        className="shrink-0 overflow-hidden rounded-md"
        style={{
          width: dim,
          height: dim,
          backgroundImage: `url(${logoSrc})`,
          backgroundPosition: '78% 78%',
          backgroundSize: '420%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-bold text-[var(--accent-primary)] tracking-tight ${text}`}>
          PRAXIS
        </span>
        <span className="text-xs font-medium text-[var(--text-muted)] tracking-[0.2em] uppercase">
          Group
        </span>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="no-underline">{content}</Link>;
  }
  return content;
}
