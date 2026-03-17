"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { AuthResponse, StaffRole, authStorage } from "../../../utils/auth";

const ROLE_OPTIONS: StaffRole[] = ["Manager", "Receptionist", "Waiter", "Accountant"];

interface SetupApiResponse {
  success?: boolean;
  message?: string;
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username and password are required");
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
        toast.success("Account created. Welcome!");
        router.push("/dashboard");
        return;
      }
      toast.success("Staff account created");
      router.push("/dashboard");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ??
        error.message ??
        "Setup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Create Your Staff Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select your role and set a username and password. You will use these to sign in from now on.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Login username"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

