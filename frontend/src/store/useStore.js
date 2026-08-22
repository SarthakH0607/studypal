/**
 * Global State Store — Zustand
 * Manages auth, navigation, and shared UI state.
 */
import { create } from 'zustand';
import { api } from '../lib/api';

const useStore = create((set, get) => ({
  // --- Auth ---
  user: null,
  profile: null,
  token: null,
  isAuthenticated: false,
  authLoading: true,

  setAuth: (user, token, profile = null) => {
    api.setToken(token);
    localStorage.setItem('oosc_token', token);
    set({ user, token, profile, isAuthenticated: true, authLoading: false });
  },

  logout: () => {
    api.setToken(null);
    localStorage.removeItem('oosc_token');
    set({ user: null, token: null, profile: null, isAuthenticated: false, authLoading: false });
  },

  restoreAuth: async () => {
    const token = localStorage.getItem('oosc_token');
    if (!token) {
      set({ authLoading: false });
      return;
    }
    api.setToken(token);
    try {
      const data = await api.getMe();
      set({
        user: data.user,
        profile: data.profile,
        token,
        isAuthenticated: true,
        authLoading: false,
      });
    } catch {
      localStorage.removeItem('oosc_token');
      api.setToken(null);
      set({ authLoading: false });
    }
  },

  // --- Navigation ---
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // --- Active context ---
  activeSubject: '',
  activeTopic: '',
  setContext: (subject, topic = '') => set({ activeSubject: subject, activeTopic: topic }),

  // --- Chat ---
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
}));

export default useStore;
