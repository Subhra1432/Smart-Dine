import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import OverviewPage from './pages/OverviewPage';
import RestaurantsPage from './pages/RestaurantsPage';
import BillingPlansPage from './pages/BillingPlansPage';
import PlatformSettingsPage from './pages/PlatformSettingsPage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/auth';
import { getMe } from './lib/api';
import { UtensilsCrossed } from 'lucide-react';

export default function App() {
  const { isLoggedIn, setLoggedIn, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    getMe()
      .then(() => {
        setLoggedIn(true);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [setLoggedIn, logout]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-700 p-6">
        {/* Saffron Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-saffron-500/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 w-full max-w-sm">
          {/* Central Unit */}
          <div className="relative scale-75 md:scale-100">
            <div className="w-24 md:w-32 h-24 md:h-32 rounded-[2rem] md:rounded-[2.5rem] bg-stone-950 border border-white/10 flex items-center justify-center shadow-[0_50px_100px_rgba(0,0,0,0.6)] animate-in zoom-in duration-1000">
              <UtensilsCrossed size={32} className="text-white md:hidden" />
              <UtensilsCrossed size={48} className="text-white hidden md:block" />
              <div className="absolute inset-0 bg-saffron-500/10 rounded-[2rem] md:rounded-[2.5rem] animate-pulse" />
            </div>
            {/* Orbiting Elements */}
            <div className="absolute -inset-8 md:-inset-10 border border-saffron-500/10 rounded-[2.5rem] md:rounded-[3.5rem] animate-[spin_15s_linear_infinite]" />
            <div className="absolute -inset-4 md:-inset-5 border-2 border-stone-800/50 rounded-[2rem] md:rounded-[3rem] animate-[ping_5s_linear_infinite]" />
          </div>

          <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-[-0.05em] uppercase">
              DineSmart <span className="text-saffron-500 tracking-normal italic">CORE</span>
            </h1>
            <div className="flex items-center gap-4 md:gap-8">
              <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent via-saffron-500/40 to-transparent" />
              <p className="text-[8px] md:text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] md:tracking-[0.6em]">Synchronizing Master Node</p>
              <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-transparent via-saffron-500/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-24 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-saffron-500/30 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLoginSuccess={() => setLoggedIn(true)} />} />
      
      <Route element={isLoggedIn ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/billing" element={<BillingPlansPage />} />
        <Route path="/settings" element={<PlatformSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
