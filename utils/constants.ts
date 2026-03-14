export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const STORAGE_KEYS = {
  accessToken: "mahameruwa_staff_access_token",
  staffUser: "mahameruwa_staff_user",
};

export const QUERY_KEYS = {
  me: ["auth", "me"] as const,
  menu: ["menu"] as const,
  rooms: ["rooms"] as const,
  orders: ["orders"] as const,
  reservations: ["reservations"] as const,
  dashboard: ["dashboard"] as const,
};

