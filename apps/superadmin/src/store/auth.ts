import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  admin: { id: string; email: string } | null;
  token: string | null;
  setLoggedIn: (val: boolean, admin?: { id: string; email: string }, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      admin: null,
      token: null,
      setLoggedIn: (val, admin, token) => set({ 
        isLoggedIn: val, 
        admin: admin || null,
        token: token || null 
      }),
      logout: () => set({ isLoggedIn: false, admin: null, token: null }),
    }),
    {
      name: 'dinesmart-superadmin-auth',
    }
  )
);
