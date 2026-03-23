"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authStorage } from "../../utils/auth";
import toast from "react-hot-toast";
import type { StaffRole } from "../../utils/auth";

const allNavItems = [
  // ═══ Manager / Receptionist / Accountant ═══
  { href: "/dashboard", label: "Overview", icon: "📊", roles: ["Manager", "Receptionist", "Accountant"] as StaffRole[] },
  { href: "/rooms", label: "Rooms", icon: "🛏️", roles: ["Manager", "Receptionist"] as StaffRole[] },
  { href: "/reservations", label: "Reservations", icon: "📅", roles: ["Manager", "Receptionist"] as StaffRole[] },
  { href: "/orders", label: "Orders", icon: "🍽️", roles: ["Manager"] as StaffRole[] },
  { href: "/menu", label: "Menu", icon: "📋", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/staff", label: "Staff Management", icon: "👥", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/finance", label: "Reports & Finance", icon: "💰", roles: ["Manager", "Accountant"] as StaffRole[] },
  { href: "/guests", label: "Guest History", icon: "👤", roles: ["Manager", "Receptionist"] as StaffRole[] },

  // ═══ Waiter Only ═══
  { href: "/waiter", label: "My Orders", icon: "🍽️", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/new-order", label: "New Order", icon: "➕", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/kitchen", label: "Kitchen Orders", icon: "👨‍🍳", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/tables", label: "Tables", icon: "🚪", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/menu", label: "Menu", icon: "📋", roles: ["Waiter"] as StaffRole[] },

  // ═══ Settings ═══
  { href: "/settings", label: "Settings", icon: "⚙️", roles: ["Manager", "Receptionist", "Accountant"] as StaffRole[] },
  { href: "/waiter/settings", label: "Settings", icon: "⚙️", roles: ["Waiter"] as StaffRole[] },
];

function getNavItemsForRole(role: StaffRole | string | null) {
  if (!role) return allNavItems;
  return allNavItems.filter((item) =>
    item.roles.some((r) => r.toLowerCase() === role.toLowerCase())
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const navItems = getNavItemsForRole(user?.role ?? null);
  const portalName = user?.role ? `${user.role} Portal` : "Staff Portal";

  return (
    <aside
      className={`flex flex-col border-r bg-white/80 backdrop-blur-sm transition-all duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* ⭐ FIXED Header with Logo */}
      <div className="px-3 py-4 border-b border-slate-100">
        {/* Top Row: Logo + Toggle */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/dashboard" className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-md border border-slate-100">
              <Image
                src="/logo.png"
                alt="Mahameruwa Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            </div>
          </Link>
          
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom Row: Hotel Name (only when expanded) */}
        {!collapsed && (
          <div className="pl-1">
            <h1 className="text-sm font-bold text-slate-800 tracking-wide">MAHAMERUWA</h1>
            <p className="text-xs text-slate-500">{portalName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-200">
          <div className="mb-2 px-3 py-2 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-900">
              {user.name || user.username}
            </p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Collapsed — User Avatar + Logout */}
      {collapsed && (
        <div className="p-2 border-t border-slate-200 space-y-2">
          {/* User Avatar */}
          {user && (
            <div 
              className="h-10 w-10 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm"
              title={user.name || user.username}
            >
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}