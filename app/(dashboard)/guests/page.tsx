"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";

/* ──────────── Types ──────────── */

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  created_at: string | null;
  last_login: string | null;
}

/* ──────────── Helpers ──────────── */

function extractArray<T>(resData: unknown): T[] {
  if (Array.isArray(resData)) return resData;
  if (resData && typeof resData === "object" && "data" in resData) {
    const inner = (resData as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  } catch {
    return "—";
  }
}

/* ──────────── Component ──────────── */

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  /* ── Fetch customers ── */
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/customers/");
      console.log("API Response:", res.data);
      return extractArray<Customer>(res.data);
    },
  });

  /* ── Search & Sort ── */
  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone_number ?? "").includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        );
      }
      if (sortBy === "oldest") {
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      }
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });

  /* ── Stats ── */
  const totalCustomers = customers.length;

  const now = new Date();
  const thisMonth = customers.filter((c) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const activeRecently = customers.filter((c) => {
    if (!c.last_login) return false;
    const diff = Date.now() - new Date(c.last_login).getTime();
    return diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const withPhone = customers.filter(
    (c) => c.phone_number && c.phone_number.trim() !== ""
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Guests</h1>
          <p className="text-sm text-slate-500 mt-1">
            All registered customer accounts and their details.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          {totalCustomers} Total Customers
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Customers", 
            value: totalCustomers, 
            icon: "👥", 
            gradient: "from-blue-500 to-blue-600",
            bg: "bg-blue-50"
          },
          { 
            label: "New This Month", 
            value: thisMonth, 
            icon: "✨", 
            gradient: "from-emerald-500 to-emerald-600",
            bg: "bg-emerald-50"
          },
          { 
            label: "Active (30 days)", 
            value: activeRecently, 
            icon: "🟢", 
            gradient: "from-teal-500 to-teal-600",
            bg: "bg-teal-50"
          },
          { 
            label: "With Phone", 
            value: withPhone, 
            icon: "📞", 
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-purple-50"
          },
        ].map(({ label, value, icon, gradient, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center text-lg`}>
                {icon}
              </div>
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} opacity-20`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: "newest" as const, label: "Newest", icon: "⬇️" },
            { key: "oldest" as const, label: "Oldest", icon: "⬆️" },
            { key: "name" as const, label: "A → Z", icon: "🔤" },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                sortBy === key
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          ⚠️ Failed to load customers. Please try again.
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                {["#", "Customer", "Email", "Phone", "Registered", "Last Active", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-200 rounded-full w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-slate-500 font-medium">No customers found</p>
                    <p className="text-slate-400 text-xs mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—";
                  const isActive = c.last_login && 
                    (Date.now() - new Date(c.last_login).getTime()) < 7 * 24 * 60 * 60 * 1000;
                  
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isActive 
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" 
                              : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                          }`}>
                            {(c.first_name?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{fullName}</p>
                            <p className="text-xs text-slate-400">ID: #{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {c.email}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {c.phone_number ? (
                          <span className="text-slate-700 font-medium flex items-center gap-1.5">
                            <span className="text-emerald-500">📞</span>
                            {c.phone_number}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">Not provided</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        {c.last_login ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {timeAgo(c.last_login)}
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full text-xs">
                            Never
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }}
                          className="opacity-0 group-hover:opacity-100 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-all"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{customers.length}</span> customers
            </p>
            <div className="text-xs text-slate-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Detail Modal ── */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold shadow-lg">
                    {(selectedCustomer.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {`${selectedCustomer.first_name || ""} ${selectedCustomer.last_name || ""}`.trim() || "—"}
                    </h2>
                    <p className="text-sm text-white/70 mt-0.5">Customer ID: #{selectedCustomer.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {[
                { icon: "👤", label: "First Name", value: selectedCustomer.first_name || "—" },
                { icon: "👤", label: "Last Name", value: selectedCustomer.last_name || "—" },
                { icon: "📧", label: "Email Address", value: selectedCustomer.email },
                { icon: "📞", label: "Phone Number", value: selectedCustomer.phone_number || "Not provided" },
                { icon: "📅", label: "Member Since", value: formatDateTime(selectedCustomer.created_at) },
                { icon: "🕐", label: "Last Login", value: selectedCustomer.last_login ? formatDateTime(selectedCustomer.last_login) : "Never logged in" },
              ].map(({ icon, label, value }, idx) => (
                <div 
                  key={label} 
                  className={`flex items-start gap-4 p-3 rounded-xl ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-slate-900 mt-1 font-medium break-all">{value}</p>
                  </div>
                </div>
              ))}

              {/* Activity Status Card */}
              <div className={`rounded-xl p-4 flex items-center justify-between ${
                selectedCustomer.last_login && 
                (Date.now() - new Date(selectedCustomer.last_login).getTime()) < 7 * 24 * 60 * 60 * 1000
                  ? "bg-emerald-50 border border-emerald-200"
                  : selectedCustomer.last_login
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-slate-100 border border-slate-200"
              }`}>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Account Status</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {selectedCustomer.last_login
                      ? `Last active ${timeAgo(selectedCustomer.last_login)}`
                      : "Never logged in"}
                  </p>
                </div>
                <div className={`h-4 w-4 rounded-full shadow-lg ${
                  selectedCustomer.last_login &&
                  Date.now() - new Date(selectedCustomer.last_login).getTime() < 7 * 24 * 60 * 60 * 1000
                    ? "bg-emerald-500 shadow-emerald-200"
                    : selectedCustomer.last_login
                      ? "bg-amber-500 shadow-amber-200"
                      : "bg-slate-400 shadow-slate-200"
                }`} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedCustomer.email) {
                    window.location.href = `mailto:${selectedCustomer.email}`;
                  }
                }}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>📧</span> Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}