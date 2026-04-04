"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authStorage } from "../../utils/auth";
import toast from "react-hot-toast";
import type { StaffRole } from "../../utils/auth";

const allNavItems = [

  // ═══════════════════════════════════════════
  // Manager Only (Full Access)
  // ═══════════════════════════════════════════
  { href: "/dashboard", label: "Overview", icon: "📊", roles: ["Manager"] as StaffRole[] },
  { href: "/rooms", label: "Rooms", icon: "🛏️", roles: ["Manager"] as StaffRole[] },
  { href: "/reservations", label: "Reservations", icon: "📅", roles: ["Manager"] as StaffRole[] },
  { href: "/orders", label: "All Orders", icon: "🍽️", roles: ["Manager"] as StaffRole[] },
  { href: "/menu", label: "Full Menu", icon: "📋", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/staff", label: "Staff Management", icon: "👥", roles: ["Manager"] as StaffRole[] },
  { href: "/dashboard/finance", label: "Reports & Finance", icon: "💰", roles: ["Manager"] as StaffRole[] },
  { href: "/guests", label: "Guest History", icon: "👤", roles: ["Manager"] as StaffRole[] },
  { href: "/settings", label: "Settings", icon: "⚙️", roles: ["Manager"] as StaffRole[] },

  // ═══════════════════════════════════════════
  // ═══════════════════════════════════════════
  // Receptionist Only
  // ═══════════════════════════════════════════
  { href: "/receptionist", label: "Dashboard", icon: "🏠", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/bookings", label: "Bookings", icon: "📅", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/checkin", label: "Check-In", icon: "✅", roles: ["Receptionist"] as StaffRole[] },      // ← 🆕
  { href: "/receptionist/checkout", label: "Check-Out", icon: "🔓", roles: ["Receptionist"] as StaffRole[] },    // ← 🆕
  { href: "/receptionist/reservations", label: "Reservations", icon: "🗓️", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/rooms", label: "Rooms", icon: "🚪", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/customers", label: "Customers", icon: "👥", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/pos", label: "Point of Sale", icon: "🛒", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/bill", label: "Billing", icon: "🧾", roles: ["Receptionist"] as StaffRole[] },
  { href: "/receptionist/settings", label: "Settings", icon: "⚙️", roles: ["Receptionist"] as StaffRole[] },
  // ═══════════════════════════════════════════
  // Accountant Only
  // ═══════════════════════════════════════════
  { href: "/accountant", label: "Dashboard", icon: "📊", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/revenue", label: "Revenue", icon: "💰", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/expenses", label: "Expenses", icon: "📉", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/invoices", label: "Invoices", icon: "🧾", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/payroll", label: "Payroll", icon: "👥", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/reports", label: "Reports", icon: "📈", roles: ["Accountant"] as StaffRole[] },
  { href: "/accountant/settings", label: "Settings", icon: "⚙️", roles: ["Accountant"] as StaffRole[] },

  // ═══════════════════════════════════════════
  // Waiter Only
  // ═══════════════════════════════════════════
  { href: "/waiter", label: "My Orders", icon: "🍽️", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/new-order", label: "New Order", icon: "➕", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/kitchen", label: "Kitchen Orders", icon: "👨‍🍳", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/tables", label: "Tables", icon: "🚪", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/menu", label: "Menu", icon: "📋", roles: ["Waiter"] as StaffRole[] },
  { href: "/waiter/settings", label: "Settings", icon: "⚙️", roles: ["Waiter"] as StaffRole[] },

  // ═══════════════════════════════════════════
  // Barman Only
  // ═══════════════════════════════════════════
  { href: "/barman", label: "Bar Overview", icon: "🍸", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/orders", label: "Bar Orders", icon: "🧾", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/menu", label: "Drink Menu", icon: "🍹", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/barcode", label: "Barcode Generator", icon: "🏷️", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/stock", label: "Stock", icon: "📦", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/sales", label: "Sales", icon: "📊", roles: ["Barman"] as StaffRole[] },
  { href: "/barman/settings", label: "Settings", icon: "⚙️", roles: ["Barman"] as StaffRole[] },
];

function getNavItemsForRole(role: StaffRole | string | null) {
  if (!role) return [];
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
      <div className="border-b border-slate-100 px-3 py-4">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex-shrink-0">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md">
              <Image
                src="/logo.png"
                alt="Mahameruwa Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="pl-1">
            <h1 className="text-sm font-bold tracking-wide text-slate-800">MAHAMERUWA</h1>
            <p className="text-xs text-slate-500">{portalName}</p>
          </div>
        )}
      </div>

      <nav className="custom-scrollbar mt-2 flex-1 space-y-1 overflow-y-auto px-2">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
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
              <span className="flex-shrink-0 text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
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
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700"
              title={user.name || user.username}
            >
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
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
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-white/70 px-6 py-3 text-xs text-slate-500 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span>© {new Date().getFullYear()} Mahameruwa Hospitality System</span>
        <span className="hidden sm:inline">Staff Admin Dashboard</span>
      </div>
    </footer>
  );
}