"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { authStorage } from "../../utils/auth";
import type { StaffRole } from "../../utils/auth";

const allNavItems = [
  { href: "/dashboard", label: "Overview", roles: ["Manager", "Receptionist", "Waiter", "Accountant"] as StaffRole[] },
  { href: "/rooms", label: "Rooms", roles: ["Manager", "Receptionist"] as StaffRole[] },
  { href: "/reservations", label: "Reservations", roles: ["Manager", "Receptionist"] as StaffRole[] },
  { href: "/orders", label: "Orders", roles: ["Manager", "Waiter"] as StaffRole[] },
  { href: "/menu", label: "Menu", roles: ["Manager", "Waiter"] as StaffRole[] },
  { href: "/settings", label: "Settings", roles: ["Manager", "Receptionist", "Waiter", "Accountant"] as StaffRole[] },
];

function getNavItemsForRole(role: StaffRole | string | null) {
  if (!role) return allNavItems;
  return allNavItems.filter((item) => item.roles.includes(role as StaffRole));
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);
useEffect(() => {
  setUser(authStorage.getUser());
}, []);
  const navItems = getNavItemsForRole(user?.role ?? null);

  return (
    <aside
      className={`flex flex-col border-r bg-white/80 backdrop-blur-sm transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
            M
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                MAHAMERUWA
              </span>
              <span className="text-xs text-slate-500">Staff Portal</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

