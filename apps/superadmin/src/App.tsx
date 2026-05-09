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
import { SplashLoading } from './components/SplashLoading';

export default function App() {
  const { isLoggedIn, setLoggedIn, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const { token, admin } = useAuthStore.getState();
    
    // If no token stored, skip the /me check and go to login
    if (!token) {
      logout();
      setIsInitializing(false);
      return;
    }

    getMe()
      .then((data) => {
        // Keep existing token, update admin from server response
        setLoggedIn(true, data?.admin || admin || undefined, token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  if (isInitializing) {
    return <SplashLoading isLoading={true} />;
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
