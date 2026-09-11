import { create } from 'zustand';
import { getMe } from '../api/client';

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
    // Note: the backend uses cookies, so token might not be in localStorage anymore.
    // getMe will throw a 401 if the cookie is missing/expired.
    set({ isLoading: true });
    try {
      const data = await getMe();
      set({
        user: { email: data.email, user_id: data.user_id, isAdmin: data.is_admin },
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
