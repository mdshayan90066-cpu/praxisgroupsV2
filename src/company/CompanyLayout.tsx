import { ReactNode, useState, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, ClipboardList, User,
  LogOut, Menu, ChevronRight, Building2,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useNavigate, useRouter } from '../router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getRoleFromUser } from '../lib/auth';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/company/dashboard' },
  { icon: Briefcase, label: 'My Internships', to: '/company/internships' },
  { icon: ClipboardList, label: 'Applications', to: '/company/applications' },
  { icon: User, label: 'Profile', to: '/company/profile' },
];

interface Props {
  children: ReactNode;
}

export default function CompanyLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { path } = useRouter();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [companyUser, setCompanyUser] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const checkCompanyAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const role = getRoleFromUser(user);
      if (role === 'company') {
        const { data } = await supabase
          .from('company_users')
          .select('full_name, email')
          .eq('user_id', user.id)
          .maybeSingle();
        setCompanyUser(data);
        setChecking(false);
      } else {
        // Redirect non-company users to appropriate dashboard
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    };

    checkCompanyAccess();
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-dark-300">
        <Logo size="sm" linkTo="/" />
      </div>

      <div className="p-4 border-b border-dark-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-600/20 border border-gold-600/30 flex items-center justify-center">
            <Building2 size={16} className="text-gold-500" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-medium text-sm truncate">{companyUser?.full_name || 'Company'}</div>
            <div className="text-gray-500 text-xs truncate">{companyUser?.email || user?.email}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sidebarItems.map(({ icon: Icon, label, to }) => (
          <button
            key={to}
            onClick={() => { navigate(to); setSidebarOpen(false); }}
            className={path === to ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
          >
            <Icon size={16} />
            <span>{label}</span>
            {path === to && <ChevronRight size={12} className="ml-auto" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-300">
        <button onClick={handleSignOut} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-600/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-800 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark-700 border-r border-dark-300 fixed h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-dark-700 border-r border-dark-300">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-dark-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="h-14 bg-dark-700 border-b border-dark-300 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            {sidebarItems.find(i => i.to === path)?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">Company Portal</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
