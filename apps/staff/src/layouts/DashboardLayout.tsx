// ═══════════════════════════════════════════
// DineSmart — Saffron & Stone Dashboard
// Design System: Industrial Intelligence / Stone Neutral
// ═══════════════════════════════════════════

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { logout } from '../lib/api';
import {
  LayoutDashboard, Receipt, ChefHat, UtensilsCrossed, BarChart3,
  Package, Settings, LogOut, Menu, X, CreditCard, Tag, MessageSquare,
  Mail, Phone, MessageCircle, Lock, ShieldCheck, Sun, Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', roles: ['OWNER', 'MANAGER'] },
  { path: '/billing', icon: Receipt, label: 'Billing', roles: ['MANAGER', 'CASHIER'] },
  { path: '/kitchen', icon: ChefHat, label: 'Kitchen', roles: ['MANAGER', 'KITCHEN_STAFF', 'CASHIER'] },
  { path: '/admin/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/feedback', icon: MessageSquare, label: 'Feedback', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/inventory', icon: Package, label: 'Inventory', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/subscription', icon: CreditCard, label: 'Subscription', roles: ['OWNER', 'MANAGER'] },
  { path: '/admin/settings', icon: Settings, label: 'Settings', roles: ['OWNER', 'MANAGER'] },
];

export default function DashboardLayout() {
  const { user, restaurant, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const storageKey = 'dinesmart-staff-theme';
  const [isDark, setIsDark] = useState(localStorage.getItem(storageKey) !== 'light');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(storageKey, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(storageKey, 'light');
    }
  }, [isDark]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const supportTemplate = `Restaurant: ${restaurant?.name || ''}\nLocation: \n\nIssue:\n`;
  const emailHref = `mailto:subhrakantabehera691@gmail.com?subject=Support Request&body=${encodeURIComponent(supportTemplate)}`;
  const whatsappHref = `https://wa.me/918658809082?text=${encodeURIComponent(supportTemplate)}`;

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white selection:bg-primary/20 relative overflow-hidden font-sans transition-colors duration-300">
      {/* ── Background Intelligence ──────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Animated Visual Core */}
        <img
          src={isDark
            ? "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2048"
            : "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"}
          alt="Premium Industrial Interior"
          className={`w-full h-full object-cover animate-ken-burns scale-110 ${isDark ? 'opacity-[0.15]' : 'opacity-[0.12]'}`}
        />

        {/* Dynamic Spatial Glows (Saffron/Stone) */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 dark:bg-primary/10 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 dark:bg-primary/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />

        {/* Glass Grain / Noise Layer */}
        <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDark ? "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" : "bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"}`} />

        {/* Subtle Base Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-stone-950/98 via-stone-900/90 to-stone-950/98' : 'from-stone-50/98 via-stone-100/90 to-stone-50/98'}`} />
      </div>

      {/* ── Primary Navigation (Sidebar) ─────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/20 dark:bg-stone-950/40 backdrop-blur-[40px] border-r border-stone-200/30 dark:border-white/5 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Identity Header */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.5rem] bg-stone-950 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center border border-white/10 relative group overflow-hidden transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110">
                <UtensilsCrossed size={24} className="text-white relative z-10 transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-full" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-[11px] text-primary uppercase tracking-[0.5em] leading-none mb-2.5">DineSmart <span className="text-stone-400">OS</span></h1>
                <p className="text-[14px] text-stone-900 dark:text-white font-black truncate uppercase tracking-[0.1em] leading-none">{restaurant?.name}</p>
              </div>
            </div>
          </div>

          {/* Navigation Matrix */}
          <nav className="flex-1 px-6 pt-4 pb-6 space-y-1.5 overflow-y-auto scrollbar-hide">
            <div className="px-4 mb-4">
              <span className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.6em] opacity-60">Command Matrix</span>
            </div>
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-[10px] font-black transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] uppercase tracking-[0.15em] border ${isActive
                    ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950 shadow-[0_15px_40px_rgba(0,0,0,0.3)] border-white/10 scale-[1.02]'
                    : 'text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'bg-white/10' : 'group-hover:bg-primary/10'}`}>
                      <item.icon size={18} className="transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-12" />
                    </div>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Intelligence Support Node */}
          <div className="mx-6 mb-8 p-6 rounded-[2rem] bg-stone-100/50 dark:bg-stone-900/50 border border-white dark:border-white/5 relative overflow-hidden group shadow-sm backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-300" />

            <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-[0.4em] mb-6 relative z-10 opacity-60">System Support</h3>
            <div className="space-y-6 relative z-10">
              <a
                href={emailHref}
                className="flex items-center gap-4 text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all duration-200 uppercase tracking-tight group/link"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm border border-stone-100 dark:border-white/5 group-hover/link:border-primary/40 group-hover/link:shadow-xl transition-all duration-200">
                  <Mail size={16} />
                </div>
                Email Support
              </a>

              {restaurant?.plan === 'PREMIUM' ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all duration-200 uppercase tracking-tight group/link"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm border border-stone-100 dark:border-white/5 group-hover/link:border-primary/40 group-hover/link:shadow-xl transition-all duration-200">
                    <MessageCircle size={16} />
                  </div>
                  WhatsApp Support
                </a>
              ) : (
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-300 dark:text-stone-600 cursor-not-allowed opacity-40 uppercase tracking-tight">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-900 flex items-center justify-center border border-stone-100 dark:border-white/5">
                    <MessageCircle size={16} />
                  </div>
                  WhatsApp Support <Lock size={10} className="ml-auto opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* User Status Interface */}
          <div className="p-8 border-t border-stone-100 dark:border-white/5 bg-white/40 dark:bg-stone-900/60 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-11 h-11 rounded-xl bg-stone-950 dark:bg-stone-800 border border-white/20 flex items-center justify-center text-white text-lg font-black shadow-xl group-hover:scale-105 transition-all duration-200">
                  {user?.email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary border-2 border-white dark:border-stone-800 rounded-full shadow-md animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-stone-950 dark:text-white truncate uppercase tracking-widest">{user?.email.split('@')[0]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck size={10} className="text-primary" />
                  <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.2em]">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-300 dark:text-stone-600 hover:text-red-500 transition-all duration-200 active:scale-90 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 hover:rotate-12"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Interaction Layer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/10 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Operational Matrix (Main Content) ────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Global Header Matrix */}
        <header className="h-20 border-b border-stone-200/50 dark:border-white/5 flex items-center px-8 gap-6 bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-4 bg-white dark:bg-stone-800 rounded-2xl text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm border border-stone-100 dark:border-white/5"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex-1">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.5em] mb-1">
                Staff Panel <span className="text-primary font-black ml-2">•</span>
              </h2>
              <p className="text-stone-900 dark:text-white font-black text-lg tracking-tight uppercase lg:block hidden">
                Manage your restaurant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 border border-white dark:border-white/5 shadow-sm backdrop-blur-md text-stone-600 dark:text-stone-400 hover:scale-110 transition-all duration-200 active:rotate-45"
            >
              {isDark ? <Sun size={20} className="text-primary" /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-4 bg-stone-100/50 dark:bg-stone-800/50 px-6 py-2.5 rounded-full border border-white/60 dark:border-white/5 shadow-sm backdrop-blur-md lg:flex hidden">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest">Node Verified</span>
            </div>
          </div>
        </header>

        {/* Scrollable Intelligence Workspace */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 relative scroll-smooth scrollbar-hide bg-transparent">
          <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-300">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

