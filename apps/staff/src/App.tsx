// ═══════════════════════════════════════════
// DineSmart — Staff App Root
// ═══════════════════════════════════════════

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from './store/auth';
import { getMe } from './lib/api';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import BillingPage from './pages/BillingPage';
import KitchenPage from './pages/KitchenPage';
import MenuManagementPage from './pages/MenuManagementPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InventoryPage from './pages/InventoryPage';
import CouponManagementPage from './pages/CouponManagementPage';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionPage from './pages/SubscriptionPage';
import FeedbackPage from './pages/FeedbackPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import { ThemeProvider } from './lib/ThemeProvider';
import { SplashLoading } from './components/SplashLoading';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isInitializing, user } = useAuthStore();

  // Still verifying the session — show a neutral loading screen, never redirect prematurely
  if (isInitializing) {
    return <SplashLoading isLoading={true} />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'KITCHEN_STAFF') return <Navigate to="/kitchen" replace />;
    if (user.role === 'CASHIER') return <Navigate to="/billing" replace />;
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { isAuthenticated, isInitializing, user } = useAuthStore();
  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'KITCHEN_STAFF') return <Navigate to="/kitchen" replace />;
  if (user?.role === 'CASHIER') return <Navigate to="/billing" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  const { isAuthenticated, setAuth, clearAuth, setInitialized } = useAuthStore();

  // On every page load/reload: verify the JWT is still valid with the server.
  // This prevents stale localStorage state from showing protected pages when the session expired.
  useEffect(() => {
    if (!isAuthenticated) {
      setInitialized();
      return;
    }

    getMe()
      .then((me: any) => {
        // Refresh user + restaurant data from server so it's always fresh
        setAuth(
          {
            userId: me.user.id,
            email: me.user.email,
            role: me.user.role,
            restaurantId: me.user.restaurantId,
            branchId: me.user.branchId,
          },
          me.restaurant
        );
      })
      .catch(() => {
        // JWT invalid / expired — clear stale state and let ProtectedRoute redirect
        clearAuth();
      })
      .finally(() => {
        setInitialized();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="dinesmart-staff-theme">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<RoleBasedRedirect />} />

        <Route element={
          <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/kitchen" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'KITCHEN_STAFF']}>
              <KitchenPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <OverviewPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/menu" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <MenuManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/coupons" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <CouponManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/subscription" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <SubscriptionPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/admin/payment/cancel" element={<PaymentCancelPage />} />
          <Route path="/admin/feedback" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <FeedbackPage />
            </ProtectedRoute>
          } />

          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'CASHIER']}>
              <BillingPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

