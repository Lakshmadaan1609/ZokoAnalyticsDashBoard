'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/apiTypes';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => {
        const today = new Date().toDateString();
        set({ user: { ...user, loginDate: today }, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      checkSession: () => {
        const { user, isAuthenticated, logout } = get();
        if (isAuthenticated && user) {
          const today = new Date().toDateString();
          if (user.loginDate !== today) {
            logout();
          }
        }
      },
    }),
    {
      name: 'zoko-auth-storage',
    }
  )
);
