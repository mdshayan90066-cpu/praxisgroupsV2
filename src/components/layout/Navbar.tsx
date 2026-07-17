import { useState, useEffect } from 'react';
import { ChevronDown, User, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import Logo from '../ui/Logo';
import { Link, useNavigate, useRouter } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationCenter } from '../ui/Notifications';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Workshops', to: '/workshops' },
  { label: 'Internships', to: '/internships' },
  { label: 'Certificates', to: '/verify-certificate' },
  { label: 'Resources', to: '/resources' },
  { label: 'About Us', to: '/about' },
  { label: 'Partnership', to: '/for-companies' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, student, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { path } = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [path]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[200] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'rgba(8,8,8,0.55)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex items-center h-[68px] gap-3 lg:gap-5">

          {/* Logo — left */}
          <div className="shrink-0">
            <Logo size="sm" />
          </div>

          {/* Horizontal nav links — beside logo */}
          <div className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {navLinks.map((link) => {
              const isActive = path === link.to || (link.to !== '/' && path.startsWith(link.to));
              const isPartnership = link.to === '/for-companies';
              if (isPartnership) {
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="shrink-0 px-3 lg:px-3.5 py-2 text-[12.5px] lg:text-[13.5px] font-semibold whitespace-nowrap rounded-full transition-all duration-150"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #C9A84C 0%, #A87C38 100%)' : 'rgba(201,168,76,0.08)',
                      color: isActive ? '#0D0D0D' : '#C9A84C',
                      border: '1px solid rgba(201,168,76,0.35)',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className="relative shrink-0 px-2.5 lg:px-3.5 py-2 text-[12.5px] lg:text-[13.5px] font-medium transition-colors duration-150 whitespace-nowrap"
                  style={{ color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.82)' }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full"
                      style={{ background: '#C9A84C' }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Theme toggle — horizontal beside links */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="shrink-0 w-[36px] h-[36px] lg:w-[42px] lg:h-[42px] rounded-full flex items-center justify-center transition-all duration-200 ml-1"
              style={{
                border: '1.5px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Right actions — auth container */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user && (
              <>
                <NotificationCenter />
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 h-[42px] px-4 text-[13px] font-semibold rounded-full transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C 0%, #A87C38 100%)',
                      color: '#0D0D0D',
                      boxShadow: '0 2px 12px rgba(201,168,76,0.30)',
                    }}
                  >
                    <User size={15} />
                    <span>{student?.full_name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown size={12} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl z-50 overflow-hidden border border-[rgba(255,255,255,0.08)]"
                        style={{ background: 'rgba(16,16,16,0.98)', backdropFilter: 'blur(20px)' }}
                      >
                        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                          <p className="text-sm font-medium text-white truncate">{student?.full_name || 'User'}</p>
                          <p className="text-xs text-[rgba(255,255,255,0.35)] truncate">{student?.email || user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/student/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                          >
                            <LayoutDashboard size={14} /> My Dashboard
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(255,255,255,0.65)] hover:text-red-400 hover:bg-[rgba(255,50,50,0.08)] transition-colors"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile auth container */}
          <div className="lg:hidden shrink-0">
            {user && (
              <Link
                to="/student/dashboard"
                className="flex items-center gap-2 h-[36px] px-3 text-[12px] font-semibold rounded-full whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C 0%, #A87C38 100%)',
                  color: '#0D0D0D',
                }}
              >
                Dashboard
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
