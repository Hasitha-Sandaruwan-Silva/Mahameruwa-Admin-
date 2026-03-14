"use client";

import { STORAGE_KEYS } from "./constants";

export type StaffRole = "Manager" | "Staff";

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: StaffRole | string;
}

// Shape aligned with typical Django/DRF auth responses
export interface AuthResponse {
  token: string;
  user: StaffUser;
}

interface StoredAuth {
  token: string;
  user: StaffUser;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorage(): StoredAuth | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.auth);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export const authStorage = {
  save(auth: AuthResponse) {
    if (!isBrowser()) return;
    const payload: StoredAuth = {
      token: auth.token,
      user: auth.user,
    };
    window.localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(payload));
  },

  getToken(): string | null {
    return readStorage()?.token ?? null;
  },

  getUser(): StaffUser | null {
    return readStorage()?.user ?? null;
  },

  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(STORAGE_KEYS.auth);
  },
};

