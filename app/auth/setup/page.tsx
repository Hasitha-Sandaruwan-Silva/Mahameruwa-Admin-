"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { AuthResponse, StaffRole, authStorage } from "../../../utils/auth";

const ROLE_OPTIONS = [
  "Manager",
  "Receptionist",
  "Waiter",
  "Accountant",
  "Barman",
] as StaffRole[];

const ROLE_CONFIG = {
  Manager: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300", desc: "Full system access" },
  Receptionist: { color: "text-blue-700", bg: "bg-blue-50 border-blue-300", desc: "Reservations & guests" },
  Waiter: { color: "text-amber-700", bg: "bg-amber-50 border-amber-300", desc: "Orders management" },
  Accountant: { color: "text-purple-700", bg: "bg-purple-50 border-purple-300", desc: "Finance & reports" },
  Barman: { color: "text-rose-700", bg: "bg-rose-50 border-rose-300", desc: "Bar & beverages" },
} as Record<StaffRole, { color: string; bg: string; desc: string }>;

interface SetupApiResponse {
  success?: boolean;
  message?: string;
  access?: string;
  user?: AuthResponse["user"];
  data?: { access?: string; user?: AuthResponse["user"] };
}

export default function StaffSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole>("Manager");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = (userRole: string) => {
    switch (userRole) {
      case "Waiter":
        return "/waiter";
      case "Receptionist":
        return "/receptionist";
      case "Accountant":
        return "/accountant";
      case "Barman":
        return "/barman";
      default:
        return "/dashboard";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username and password are required");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.post<SetupApiResponse>("/api/staff/setup/", {
        role,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        username: username.trim(),
        password,
      });
      const payload = res.data?.data ?? res.data;
      if (payload?.access && payload?.user) {
        authStorage.save({ access: payload.access, user: payload.user });
        toast.success(`Welcome, ${payload.user.name || payload.user.username}!`);
        router.push(redirectByRole(payload.user.role));
        return;
      }
      toast.success("Account created! Please login.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const msg =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        "Setup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = ROLE_CONFIG[role];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
            M
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            First Time Setup
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create your staff account to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Your Role</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((r) => {
                const cfg = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      role === r
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold">{r}</p>
                    <p className="text-xs opacity-70 mt-0.5">{cfg.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kamal Perera"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamal@gmail.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="kamal.perera"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min 8 characters"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${selectedConfig.bg}`}>
            <p className={`text-xs font-semibold ${selectedConfig.color}`}>
              {role} Account
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{selectedConfig.desc}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create Account & Login"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <a href="/auth/login" className="text-emerald-600 hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}