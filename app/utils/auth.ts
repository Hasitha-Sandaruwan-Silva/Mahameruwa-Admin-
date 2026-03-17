"use client";

import { STORAGE_KEYS } from "./constants";

export type StaffRole = "Manager" | "Receptionist" | "Waiter" | "Accountant";

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: StaffRole | string;
}

export interface AuthResponse {
  access: string;
  user: StaffUser;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export const authStorage = {
  save(auth: AuthResponse) {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEYS.accessToken, auth.access);
    window.localStorage.setItem(STORAGE_KEYS.staffUser, JSON.stringify(auth.user));
  },

  getToken(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(STORAGE_KEYS.accessToken);
  },

  getUser(): StaffUser | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(STORAGE_KEYS.staffUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffUser;
    } catch {
      return null;
    }
  },

  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(STORAGE_KEYS.accessToken);
    window.localStorage.removeItem(STORAGE_KEYS.staffUser);
  },
};



