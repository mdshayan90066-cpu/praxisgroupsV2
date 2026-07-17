import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, BookOpen, Briefcase,
  ClipboardList, Award, CreditCard, Mail, BarChart3,
  Settings, LogOut, Menu, ChevronRight, Handshake, Shield, UserCog
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useNavigate, useRouter } from '../router';
import { useAdminAuth } from './AdminAuth';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: Users, label: 'Students', to: '/admin/students' },
  { icon: Building2, label: 'Companies', to: '/admin/companies' },
  { icon: BookOpen, label: 'Workshops', to: '/admin/workshops' },
  { icon: Briefcase, label: 'Internships', to: '/admin/internships' },
  { icon: Handshake, label: 'Collaborations', to: '/admin/collaborations' },
  { icon: UserCog, label: 'Team Members', to: '/admin/team' },
  { icon: ClipboardList, label: 'Applications', to: '/admin/applications' },
  { icon: Award, label: 'Certificates', to: '/admin/certificates' },
  { icon: CreditCard, label: 'Payments', to: '/admin/payments' },
  { icon: Mail, label: 'Email Center', to: '/admin/emails' },
  { icon: BarChart3, label: 'Analytics', to: '/admin/analytics' },
  { icon: Settings, label: 'Settings', to: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { path } = useRouter();
  const navigate = useNavigate();

  const { adminEmail, signOut } = useAdminAuth();

  const handleLogout = () => {
    signOut();
    navigate('/admin');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[var(--bg-elevated)]">
      <div className="p-5 border-b border-[var(--surface-border)]">
        <Logo size="sm" linkTo="" />
        <div className="mt-3 px-3 py-1.5 bg-[var(--accent-primary-muted)] border border-[var(--accent-primary-muted)] rounded-lg text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Shield size={10} className="text-[var(--accent-primary)]" />
            <span className="text-[var(--accent-primary)] text-[10px] font-semibold uppercase tracking-wider">Admin Portal</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--surface-border)]">
        <div className="text-[var(--text-muted)] text-xs truncate">{adminEmail}</div>
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--accent-primary-muted)] rounded-full">
          <span className="text-[var(--accent-primary)] text-[10px] font-medium">Administrator</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sidebarItems.map(({ icon: Icon, label, to }) => {
          const isActive = path === to || path.startsWith(to + '/');
          return (
            <button
              key={to}
              onClick={() => { navigate(to); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary-muted)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[var(--accent-primary)]' : ''} />
              <span>{label}</span>
              {isActive && <ChevronRight size={12} className="ml-auto text-[var(--accent-primary)]" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--surface-border)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex w-full overflow-hidden">
      {/* Structural Sidebar Desktop Track */}
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--bg-elevated)] border-r border-[var(--surface-border)] fixed h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-[var(--bg-elevated)] border-r border-[var(--surface-border)] h-full">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-[var(--bg-base)]/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Primary Layout Body Element */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <header className="h-14 bg-[var(--bg-elevated)]/80 backdrop-blur-lg border-b border-[var(--surface-border)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 w-full">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <span className="text-sm text-[var(--text-muted)]">
              {sidebarItems.find(i => path.startsWith(i.to))?.label || 'Admin Portal'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] hidden sm:block">{adminEmail}</span>
          </div>
        </header>

        {/* Clean content panel mount canvas */}
        <main key={path} className="flex-1 p-4 lg:p-8 page-transition w-full relative box-border">
          {children}
        </main>
      </div>
    </div>
  );
}
