import { create } from "zustand";

export type Role = "ADMIN" | "MANAGER" | "SALE";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  saleAccId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
