// ═══════════════════════════════════════════
// DineSmart — Superadmin Layout
// ═══════════════════════════════════════════

import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Building2, CreditCard, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/auth';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/restaurants', icon: Building2, label: 'Restaurants' },
  { path: '/billing', icon: CreditCard, label: 'Billing & Plans' },
  { path: '/settings', icon: Settings, label: 'Platform Settings' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
   const { logout, admin } = useAuthStore();
  const location = useLocation();

  const { data: restaurants } = useQuery({
    queryKey: ['saRestaurants'],
    queryFn: () => fetchApi('/superadmin/restaurants?limit=50'),
    refetchInterval: 30000
  });

  const notifications = (() => {
    if (!restaurants?.items) return [];
    const notes: any[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    restaurants.items.forEach((r: any) => {
      // New Registration notification
      if (new Date(r.createdAt) > sevenDaysAgo) {
        notes.push({
          id: `reg-${r.id}`,
          type: 'REGISTRATION',
          title: 'New Node Registered',
          message: `${r.name} joined the platform`,
          time: new Date(r.createdAt).toLocaleDateString(),
          icon: Building2,
          color: 'text-primary'
        });
      }
      // Paid Notification
      if (r.hasPaid) {
        notes.push({
          id: `pay-${r.id}`,
          type: 'PAYMENT',
          title: 'Subscription Paid',
          message: `${r.name} completed payment for ${r.plan} tier`,
          time: 'Verified',
          icon: CreditCard,
          color: 'text-emerald-500'
        });
      }
    });

    return notes.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Protocol Disconnected');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white selection:bg-saffron-500/20 relative overflow-hidden font-sans transition-colors duration-700">
      {/* ── Background Intelligence ──────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2048" 
          alt="Premium Office Interior"
          className="w-full h-full object-cover animate-ken-burns scale-110 opacity-[0.12] dark:opacity-[0.15]"
        />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-saffron-500/5 dark:bg-saffron-500/10 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50/98 via-stone-100/90 to-stone-50/98 dark:from-stone-950/98 dark:via-stone-900/90 dark:to-stone-950/98" />
      </div>

      {/* ── Primary Navigation (Sidebar) ─────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/20 dark:bg-stone-950/40 backdrop-blur-[40px] border-r border-stone-200/30 dark:border-white/5 transform transition-all duration-1000 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Identity Header */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.5rem] bg-stone-950 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center border border-white/10 relative group overflow-hidden transition-all duration-700 hover:scale-110">
                <Shield size={24} className="text-white relative z-10 transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 bg-saffron-500/20 scale-0 group-hover:scale-100 transition-transform duration-1000 rounded-full" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-[11px] text-saffron-500 uppercase tracking-[0.5em] leading-none mb-2.5">DineSmart <span className="text-stone-400">CORE</span></h1>
                <p className="text-[14px] text-stone-900 dark:text-white font-black truncate uppercase tracking-[0.1em] leading-none">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation Matrix */}
          <nav className="flex-1 px-6 pt-4 pb-6 space-y-1.5 overflow-y-auto scrollbar-hide">
            <div className="px-4 mb-4">
              <span className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.6em] opacity-60">Command Matrix</span>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-[10px] font-black transition-all duration-700 uppercase tracking-[0.15em] border ${
                    isActive
                      ? 'bg-stone-950 dark:bg-saffron-500 text-white dark:text-stone-950 shadow-[0_15px_40px_rgba(0,0,0,0.3)] border-white/10 scale-[1.02]'
                      : 'text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-white/10' : 'group-hover:bg-saffron-500/10'}`}>
                      <item.icon size={18} className="transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Intelligence Support Node */}
          <div className="mx-6 mb-8 p-6 rounded-[2rem] bg-stone-100/50 dark:bg-stone-900/50 border border-white dark:border-white/5 relative overflow-hidden group shadow-sm backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-saffron-500/10 transition-all duration-1000" />

            <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-[0.4em] mb-6 relative z-10 opacity-60">System Support</h3>
            <div className="space-y-6 relative z-10">
              <a
                href="mailto:support@dinesmart.ai"
                className="flex items-center gap-4 text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all duration-500 uppercase tracking-tight group/link"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm border border-stone-100 dark:border-white/5 group-hover/link:border-saffron-500/40 group-hover/link:shadow-xl transition-all duration-700">
                  <Bell size={16} />
                </div>
                Support Link
              </a>

              <a
                href="https://wa.me/919937000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all duration-500 uppercase tracking-tight group/link"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm border border-stone-100 dark:border-white/5 group-hover/link:border-saffron-500/40 group-hover/link:shadow-xl transition-all duration-700">
                  <Shield size={16} />
                </div>
                Direct Node
              </a>
            </div>
          </div>

          {/* User Status Interface */}
          <div className="p-8 border-t border-stone-100 dark:border-white/5 bg-white/40 dark:bg-stone-900/60 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-11 h-11 rounded-xl bg-stone-950 dark:bg-stone-800 border border-white/20 flex items-center justify-center text-white text-lg font-black shadow-xl group-hover:scale-105 transition-all duration-700">
                  {admin?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-saffron-500 border-2 border-white dark:border-stone-800 rounded-full shadow-md animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-stone-950 dark:text-white truncate uppercase tracking-widest">
                  {admin?.email?.split('@')[0] || 'Admin'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield size={10} className="text-saffron-500" />
                  <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.2em]">Root Authority</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-300 dark:text-stone-600 hover:text-red-500 transition-all duration-700 active:scale-90 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 hover:rotate-12"
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
          className="fixed inset-0 bg-stone-900/10 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-500"
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
                 Root Intelligence <span className="text-saffron-500 font-black ml-2">•</span>
               </h2>
               <p className="text-stone-900 dark:text-white font-black text-lg tracking-tight uppercase lg:block hidden">
                 Master Command Terminal
               </p>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-3.5 rounded-2xl border transition-all duration-500 relative ${
                    showNotifications 
                    ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30' 
                    : 'bg-stone-100/80 dark:bg-stone-800/80 border-white dark:border-white/5 text-stone-600 dark:text-stone-400 hover:scale-110'
                  }`}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-saffron-500 rounded-full border-2 border-white dark:border-stone-800 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-4 w-80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200 dark:border-white/10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 z-50">
                    <div className="p-6 border-b border-stone-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-widest">Protocol Alerts</h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black tracking-widest uppercase">{notifications.length} NEW</span>
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">No critical alerts</p>
                        </div>
                      ) : (
                        notifications.map((note) => (
                          <div key={note.id} className="p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-stone-100 dark:hover:border-white/5">
                            <div className="flex gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center ${note.color} group-hover:scale-110 transition-transform`}>
                                <note.icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-stone-950 dark:text-white uppercase tracking-tight truncate">{note.title}</p>
                                <p className="text-[9px] text-stone-500 font-medium mt-0.5 leading-tight">{note.message}</p>
                                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-2">{note.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 bg-stone-50/50 dark:bg-white/5 border-t border-stone-100 dark:border-white/5">
                      <button className="w-full py-3 text-[9px] font-black text-stone-400 hover:text-primary uppercase tracking-[0.2em] transition-colors">
                        Clear All Intelligence
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-4 bg-stone-100/50 dark:bg-stone-800/50 px-6 py-2.5 rounded-full border border-white/60 dark:border-white/5 shadow-sm backdrop-blur-md lg:flex hidden">
                <div className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest">Master Node Live</span>
            </div>
          </div>
        </header>

        {/* Scrollable Intelligence Workspace */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 relative scroll-smooth scrollbar-hide bg-transparent">
          <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
