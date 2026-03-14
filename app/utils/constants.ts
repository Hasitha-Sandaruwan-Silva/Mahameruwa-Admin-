export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const STORAGE_KEYS = {
  auth: "mahameruwa_staff_auth",
} as const;

export const QUERY_KEYS = {
  menu: ["menu"] as const,
  rooms: ["rooms"] as const,
  orders: ["orders"] as const,
  reservations: ["reservations"] as const,
  dashboard: ["dashboard"] as const,
  profile: ["profile"] as const,
  users: ["users"] as const,
};

