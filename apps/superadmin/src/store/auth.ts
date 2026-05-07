import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  admin: { id: string; email: string } | null;
  setLoggedIn: (val: boolean, admin?: { id: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      admin: null,
      setLoggedIn: (val, admin) => set({ isLoggedIn: val, admin: admin || null }),
      logout: () => set({ isLoggedIn: false, admin: null }),
    }),
    {
      name: 'dinesmart-superadmin-auth',
    }
  )
);
