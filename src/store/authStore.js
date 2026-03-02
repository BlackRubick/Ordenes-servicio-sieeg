import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');
    return { user, role };
  } catch {
    return { user: null, role: null };
  }
};

// Estado global para usuario autenticado y rol
export const useAuthStore = create((set) => ({
  ...getStoredUser(),
  login: (user, role) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    set({ user, role });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    set({ user: null, role: null });
  },
}));
