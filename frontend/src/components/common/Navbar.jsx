import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  BrainCircuit, 
  History, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const Navbar = ({ publicOnly = false }) => {
  const { currentUser, userProfile, profileError, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicPage = publicOnly || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // When on private pages: full application feature navigation
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resume Analyzer', path: '/resume', icon: FileText },
    { label: 'Mock Interview', path: '/interview/setup', icon: BrainCircuit },
    { label: 'History', path: '/history', icon: History },
    { label: 'Study Plan', path: '/study-plan', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Skillix Logo */}
          <Link to={isPublicPage ? '/' : '/dashboard'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-0.5">
                Skill<span className="text-indigo-600">ix</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest -mt-1">
                AI Interview Coach
              </span>
            </div>
          </Link>

          {/* Conditional Middle Navigation */}
          {/* Public Navbar: Never show private links */}
          {/* Protected Navbar: Show all module links */}
          {!isPublicPage && currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isPublicPage ? (
              // PUBLIC NAVBAR ACTIONS: Always clean Log In and Get Started
              <div className="flex items-center gap-3">
                {currentUser && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors mr-1"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link
                  to="/login"
                  className={`landing-public-login px-3.5 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/login'
                      ? 'text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="landing-public-signup px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              // PROTECTED APP NAVBAR ACTIONS: Profile avatar and Logout
              currentUser && (
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-sm font-medium transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <span className="max-w-[120px] truncate">{userProfile?.name || currentUser.displayName || 'Profile'}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button (Only for private navigation) */}
          {!isPublicPage && currentUser && (
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}

          {/* Mobile Public Actions (If on public page) */}
          {isPublicPage && (
            <div className="md:hidden flex items-center gap-2">
              <Link
                to="/login"
                className="landing-public-login px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="landing-public-signup px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile Sync Error Banner: ONLY on private authenticated views, NEVER on public landing */}
      {!isPublicPage && currentUser && profileError && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
            <span>Profile sync issue: {profileError}</span>
            <Link to="/profile" className="shrink-0 font-semibold underline">
              Review profile
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Drawer (Private pages only) */}
      {!isPublicPage && currentUser && mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Icon className="w-5 h-5 text-indigo-500" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-800 font-medium text-sm"
            >
              My Profile ({userProfile?.name || currentUser.displayName || 'User'})
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 font-medium hover:bg-rose-50 text-left text-sm"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
