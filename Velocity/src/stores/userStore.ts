import { persist } from "zustand/middleware";
import type { User } from "../Types/User";
import { create } from "zustand";
import axiosInstance from "../api/axiosConfig";
import { clearAuthData, getAccessToken } from "../service/tokenService";

interface userState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  updateUser: (user: Partial<User>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useUserStore = create<userState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User | null) =>
        set({ user, isAuthenticated: !!user, isLoading: false, error: null }),

      updateUser: (user) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
          error: null,
        }));
      },

      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        clearAuthData();
      },
      checkAuthStatus: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await axiosInstance.get<{ user: User }>("/users/me");
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error?.message as string | null,
          });
          clearAuthData();
        }
      },
    }),
    {
      name: "user-storage", // Unique name for the storage
    }
  )
);
