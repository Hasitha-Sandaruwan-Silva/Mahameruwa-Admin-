"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authStorage } from "../../../utils/auth";
import toast from "react-hot-toast";

export default function WaiterSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    toast.success("Logged out");
    router.push("/auth/login");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Account and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            👨‍🍳
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.name || "Waiter"}
            </h2>
            <p className="text-sm text-slate-500">{user?.role || "Waiter"}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h3 className="font-medium text-rose-900">Logout</h3>
        <p className="mt-1 text-sm text-rose-700">Sign out from your account</p>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}