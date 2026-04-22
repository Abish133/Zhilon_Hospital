import { create } from 'zustand';
import AuthService from '@services/AuthService';

export const useAuthStore = create((set) => ({
  user: AuthService.getCurrentUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token, user) => {
    AuthService.setAuth(token, user);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    AuthService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  updateUser: (user) => set({ user })
}));

export const useAppStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  loading: false,
  setLoading: (loading) => set({ loading }),
  
  notifications: [],
  addNotification: (notification) => 
    set((state) => ({ notifications: [...state.notifications, notification] })),
  removeNotification: (id) => 
    set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }))
}));
