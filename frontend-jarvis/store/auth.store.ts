// Store para gestionar el estado de autenticación
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  userName: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "auth-storage", // clave en localStorage
      partialize: (state) => ({ user: state.user }), // solo persiste el user, no las funciones
    },
  ),
);
