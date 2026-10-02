import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Inbox, LayoutDashboard, LogOut, Menu, Receipt, Settings, Users, Wallet, X } from 'lucide-react';
import { useAuth } from '../auth';
import { cn } from '../utils';
import Logo from './Logo';
import { Avatar } from './ui';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/requests', label: 'New Requests', icon: Inbox },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/readings', label: 'Readings', icon: BookOpen },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside id="sidebar" aria-label="Main navigation"
        className={cn('fixed inset-y-0 left-0 z-40 w-72 lg:w-64 bg-white border-r border-line flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full invisible lg:visible lg:translate-x-0')}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-line">
          <Logo />
          <button className="lg:hidden p-1 text-muted" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3.5 h-11 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas hover:text-ink')}>
              <Icon className="size-5" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-line">
          <button onClick={onLogout} disabled={loggingOut}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 h-11 text-sm font-medium text-muted hover:bg-red-50 hover:text-bad disabled:opacity-60">
            <LogOut className="size-5" aria-hidden /> {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-line flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 text-ink" onClick={() => setOpen(true)} aria-label="Open menu" aria-controls="sidebar" aria-expanded={open}><Menu className="size-6" /></button>
            <span className="lg:hidden"><Logo /></span>
            <span className="hidden lg:block text-sm text-muted">Astrologer Dashboard</span>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block text-sm text-muted truncate">{email}</span>
            <Avatar name={email ?? 'A'} size="sm" />
          </div>
        </header>
        <main className="p-4 sm:p-8 max-w-6xl mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
