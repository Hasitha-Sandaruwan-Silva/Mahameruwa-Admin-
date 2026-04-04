"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authStorage } from "../../utils/auth";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const u = authStorage.getUser();
    setUser(u);

    if (!u || (u.role !== "Receptionist" && u.role !== "Manager")) {
      toast.error("Access denied");
      window.location.href = "/auth/login";
    }
  }, []);

  const navItems = [
    { label: "Overview", href: "/receptionist", icon: "🏠" },
    { label: "Reservations", href: "/receptionist/reservations", icon: "📋" },
    { label: "Bookings", href: "/receptionist/bookings", icon: "📦" },
    { label: "Check-In", href: "/receptionist/checkin", icon: "✅" },
    { label: "Check-Out", href: "/receptionist/checkout", icon: "🔓" },
    { label: "Rooms", href: "/receptionist/rooms", icon: "🛏️" },
    { label: "Customers", href: "/receptionist/customers", icon: "👥" },
    { label: "Point of Sale", href: "/receptionist/pos", icon: "🛒" },
    { label: "Bill", href: "/receptionist/bill", icon: "🧾" },
  ];

  const handleLogout = () => {
    authStorage.clear();
    toast.success("Logged out successfully");
    window.location.href = "/auth/login";
  };

  const isActive = (href: string) => {
    if (href === "/receptionist") {
      return pathname === "/receptionist";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`flex flex-col border-r bg-white/80 backdrop-blur-sm transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="border-b border-slate-100 px-3 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <span className="text-sm font-semibold leading-none">
                {collapsed ? "›" : "‹"}
              </span>
            </button>
          </div>

          {!collapsed && (
            <div className="pl-1">
              <h1 className="text-sm font-bold tracking-wide text-slate-800">
                MAHAMERUWA
              </h1>
              <p className="text-xs text-slate-500">Receptionist Portal</p>
            </div>
          )}
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => {
                  window.location.href = item.href;
                }}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex-shrink-0 text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && user && (
          <div className="border-t border-slate-200 p-3">
            <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-900">
                {user.name || user.username}
              </p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 transition-colors hover:bg-red-50"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        )}

        {collapsed && (
          <div className="space-y-2 border-t border-slate-200 p-2">
            {user && (
              <div
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
                title={user.name || user.username}
              >
                {(user.name || user.username || "R").charAt(0).toUpperCase()}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Sign out"
            >
              🚪
            </button>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white/70 px-6 backdrop-blur-sm">
          <span className="font-medium text-slate-800 text-sm">
            Receptionist Portal
          </span>

          {user && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {(user.name || user.username || "R")[0].toUpperCase()}
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="font-medium text-slate-900">
                  {user.name || user.username}
                </span>
                <span className="text-xs text-slate-500">{user.role}</span>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>

        <footer className="border-t bg-white/70 px-6 py-3 text-xs text-slate-500">
          © {new Date().getFullYear()} Mahameruwa Hospitality System
        </footer>
      </div>
    </div>
  );
}