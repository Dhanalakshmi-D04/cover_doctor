import { create } from 'zustand';

export const useUIStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  activeTab: 'home',
  activeCoverId: null,
  toast: null,
  isMobileNavOpen: false,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      return { theme: nextTheme };
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveCoverId: (coverId) => set({ activeCoverId: coverId }),

  setMobileNavOpen: (isOpen) => set({ isMobileNavOpen: isOpen }),

  showToast: (message, type = 'info', duration = 3000) => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => {
      set((state) => (state.toast?.id ? { toast: null } : state));
    }, duration);
  },

  hideToast: () => set({ toast: null }),
}));
