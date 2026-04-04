"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { authStorage, AuthResponse } from "../../../utils/auth";

interface LoginApiResponse {
  success?: boolean;
  message?: string;
  access?: string;
  user?: AuthResponse["user"];
  setup_required?: boolean;
  data?: {
    setup_required?: boolean;
    access?: string;
    user?: AuthResponse["user"];
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      toast.error("Please enter username/email and password");
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.post<LoginApiResponse>("/api/staff/login/", {
        username: usernameOrEmail.trim(),
        email: usernameOrEmail.trim(),
        password,
      });
      console.log("RAW response:", res.data);
      const payload = res.data?.data ?? res.data;
      if (payload?.setup_required) {
        toast.success("Please create your first staff account");
        router.push("/auth/setup");
        return;
      }
      if (payload?.access && payload?.user) {
  authStorage.save({ access: payload.access, user: payload.user });
  toast.success("Welcome back");
  
  
  const role: string = payload.user.role;
if (role === "Waiter") router.push("/waiter");
else if (role === "Receptionist") router.push("/receptionist");
else if (role === "Accountant") router.push("/accountant");
else if (role === "Barman") router.push("/barman");
else router.push("/dashboard");
  return;
}
      toast.error("Invalid response from server");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ??
        error.message ??
        "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
            M
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Staff Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your username or email. First time? Use default admin (admin / admin123) to set up.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Username or Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="admin or your username"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

