import { STORAGE_KEYS } from "./constants";

export type StaffRole = "Manager" | "Staff";

export interface StaffUser {
  id?: number;
  name: string;
  email: string;
  username: string;
  role: StaffRole;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: StaffUser;
}

export const authStorage = {
  save(auth: AuthResponse) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.accessToken, auth.access);
    window.localStorage.setItem(
      STORAGE_KEYS.staffUser,
      JSON.stringify(auth.user),
    );
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEYS.accessToken);
    window.localStorage.removeItem(STORAGE_KEYS.staffUser);
  },
  getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEYS.accessToken);
  },
  getUser(): StaffUser | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEYS.staffUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffUser;
    } catch {
      return null;
    }
  },
};

