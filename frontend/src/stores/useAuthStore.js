import { create } from 'zustand';
import { getAccount } from '../api/client';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  plan: 'free',
  projectCount: 0,
  projectLimit: 0,
  credits: 50,
  isLoading: false,

  setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),

  fetchAccount: async () => {
    if (!localStorage.getItem('token')) return;
    set({ isLoading: true });
    try {
      const data = await getAccount();
      set({
        plan: data.plan || 'free',
        projectCount: data.project_count ?? 0,
        projectLimit: data.project_limit ?? 0,
        credits: data.credits ?? 50,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  deductCredit: (amount = 1) => {
    set((state) => ({ credits: Math.max(0, state.credits - amount) }));
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, plan: 'free', projectCount: 0, projectLimit: 0, credits: 0 });
  },
}));
