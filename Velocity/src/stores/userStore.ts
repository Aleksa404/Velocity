import { persist } from "zustand/middleware";
import type { User } from "../Types/User";
import { create } from "zustand";

interface userState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  updateUser: (user: Partial<User>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<userState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, error: null }),

      updateUser: (user) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
          error: null,
        }));
      },

      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearUser: () => set({ user: null, isLoading: false, error: null }),
    }),
    {
      name: "user-storage", // Unique name for the storage
    }
  )
);
