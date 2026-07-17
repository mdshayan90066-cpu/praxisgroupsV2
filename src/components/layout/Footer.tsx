import { Mail, Phone, Linkedin, Twitter, Instagram } from 'lucide-react';
import Logo from '../ui/Logo';
import { Link } from '../../router';

const footerLinks = {
  programs: [
    { label: 'Workshops', href: '/workshops' },
    { label: 'Internships', href: '/internships' },
    { label: 'For Companies', href: '/for-companies' },
    { label: 'Certificate Verification', href: '/verify-certificate' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Sign In', href: '/login' },
    { label: 'Create Account', href: '/signup' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

const socialLinks = [
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg-subtle)] border-t border-[var(--surface-border)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo size="md" className="mb-5" />
            <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-6 max-w-sm">
              Praxis Group is India's premier EdTech platform, bridging the gap between academia and industry through world-class workshops, internships, and certifications.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[var(--bg-interactive)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-interactive-hover)] transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-5">Programs</h4>
            <ul className="space-y-3">
              {footerLinks.programs.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-5">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--text-tertiary)]">partnerships@praxisgroup.online</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--text-tertiary)]">+91 92798 64338</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--surface-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            &copy; {currentYear} Praxis Group. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map(({ label, href }) => (
              <Link key={label} to={href} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
