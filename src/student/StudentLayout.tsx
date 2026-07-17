import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, BookOpen, Briefcase, ClipboardList,
  Clock, Award, CreditCard, Download, HelpCircle,
  User, LogOut, Menu, ChevronRight
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useNavigate, useRouter } from '../router';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/student/dashboard' },
  { icon: BookOpen, label: 'My Workshops', to: '/student/workshops' },
  { icon: Briefcase, label: 'My Internships', to: '/student/internships' },
  { icon: ClipboardList, label: 'Assignments', to: '/student/assignments' },
  { icon: Clock, label: 'Attendance', to: '/student/attendance' },
  { icon: Award, label: 'Certificates', to: '/student/certificates' },
  { icon: CreditCard, label: 'Payments', to: '/student/payments' },
  { icon: Download, label: 'Downloads', to: '/student/downloads' },
  { icon: HelpCircle, label: 'Support', to: '/student/support' },
  { icon: User, label: 'Profile', to: '/student/profile' },
];

// 🟢 Correct parameter structure matching ReactNode definitions explicitly
export default function StudentLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { path } = useRouter();
  const navigate = useNavigate();
  
  const authContext = useAuth();
  const student = authContext?.student;
  const signOut = authContext?.signOut || (() => {});

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[var(--bg-elevated)]">
      <div className="p-5 border-b border-[var(--surface-border)]">
        <Logo size="sm" linkTo="/" />
      </div>

      <div className="p-4 border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-muted)] border border-[var(--surface-border)] flex items-center justify-center">
            <User size={16} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[var(--text-primary)] font-medium text-sm truncate">{student?.full_name || 'Student'}</div>
            <div className="text-[var(--text-muted)] text-xs truncate">{student?.email || 'portal@user.com'}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sidebarItems.map(({ icon: Icon, label, to }) => {
          const isActive = path === to;
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
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-lg transition-colors">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex w-full">
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--bg-elevated)] border-r border-[var(--surface-border)] fixed h-full z-40">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-[var(--bg-elevated)] border-r border-[var(--surface-border)]">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-[var(--bg-base)]/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="h-14 bg-[var(--bg-elevated)]/80 backdrop-blur-lg border-b border-[var(--surface-border)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-sm text-[var(--text-muted)]">
            {sidebarItems.find(i => i.to === path)?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] hidden sm:block">Student Portal</span>
          </div>
        </header>

        {/* 🟢 Children is now fully defined and loaded without reference errors */}
        <main key={path} className="flex-1 p-4 lg:p-8 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
