"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStorage } from "../../utils/auth";
import toast from "react-hot-toast";

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);

  useEffect(() => {
  const u = authStorage.getUser();
  setUser(u);
  if (!u || u.role !== "Waiter") {
    toast.error("Access denied");
    router.push("/auth/login");
  }
}, []);

  const navItems = [
    { label: "Orders", href: "/waiter" },
    { label: "New Order", href: "/waiter/new-order" },
    { label: "Menu", href: "/waiter/menu" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">M</div>
            <div>
              <p className="text-xs font-semibold text-slate-900">MAHAMERUWA</p>
              <p className="text-xs text-slate-500">Waiter Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="mb-2 px-3 py-1">
            <p className="text-xs font-medium text-slate-900">{user?.name || user?.username}</p>
            <p className="text-xs text-slate-500">Waiter</p>
          </div>
          <button
            onClick={() => { authStorage.clear(); router.push("/auth/login"); }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}