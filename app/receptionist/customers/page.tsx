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

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/customers/");
      return extractArray<Customer>(res.data);
    },
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Guests</h1>
          <p className="mt-1 text-sm text-slate-500">
            All registered customer accounts and their details.
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          {totalCustomers} Total Customers
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Customers",
            value: totalCustomers,
            icon: "👥",
            gradient: "from-blue-500 to-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "New This Month",
            value: thisMonth,
            icon: "✨",
            gradient: "from-emerald-500 to-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Active (30 days)",
            value: activeRecently,
            icon: "🟢",
            gradient: "from-teal-500 to-teal-600",
            bg: "bg-teal-50",
          },
          {
            label: "With Phone",
            value: withPhone,
            icon: "📞",
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-purple-50",
          },
        ].map(({ label, value, icon, gradient, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${bg}`}>
                {icon}
              </div>
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} opacity-20`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "newest" as const, label: "Newest", icon: "⬇️" },
            { key: "oldest" as const, label: "Oldest", icon: "⬆️" },
            { key: "name" as const, label: "A → Z", icon: "🔤" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                sortBy === key
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ Failed to load customers. Please try again.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                {["#", "Customer", "Email", "Phone", "Registered", "Last Active", "Action"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
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
                        <div className="h-4 w-20 rounded-full bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="mb-3 text-4xl">🔍</div>
                    <p className="font-medium text-slate-500">No customers found</p>
                    <p className="mt-1 text-xs text-slate-400">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—";
                  const isActive =
                    !!c.last_login &&
                    Date.now() - new Date(c.last_login).getTime() < 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={c.id}
                      className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isActive
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                            }`}
                          >
                            {(c.first_name?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                            <p className="text-xs text-slate-400">ID: #{c.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {c.email}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {c.phone_number ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <span className="text-emerald-500">📞</span>
                            {c.phone_number}
                          </span>
                        ) : (
                          <span className="italic text-slate-300">Not provided</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(c.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        {c.last_login ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {timeAgo(c.last_login)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
                            Never
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700"
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

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
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

      {/* Details Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 text-white">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold shadow-lg backdrop-blur">
                    {(selectedCustomer.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {`${selectedCustomer.first_name || ""} ${selectedCustomer.last_name || ""}`.trim() || "—"}
                    </h2>
                    <p className="mt-0.5 text-sm text-white/70">Customer ID: #{selectedCustomer.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4 p-6">
              {[
                { icon: "👤", label: "First Name", value: selectedCustomer.first_name || "—" },
                { icon: "👤", label: "Last Name", value: selectedCustomer.last_name || "—" },
                { icon: "📧", label: "Email Address", value: selectedCustomer.email || "—" },
                { icon: "📞", label: "Phone Number", value: selectedCustomer.phone_number || "Not provided" },
                { icon: "📅", label: "Member Since", value: formatDateTime(selectedCustomer.created_at) },
                {
                  icon: "🕐",
                  label: "Last Login",
                  value: selectedCustomer.last_login
                    ? formatDateTime(selectedCustomer.last_login)
                    : "Never logged in",
                },
              ].map(({ icon, label, value }, idx) => (
                <div
                  key={label}
                  className={`flex items-start gap-4 rounded-xl p-3 ${
                    idx % 2 === 0 ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  <span className="mt-0.5 text-xl">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">{value}</p>
                  </div>
                </div>
              ))}

              <div
                className={`flex items-center justify-between rounded-xl p-4 ${
                  selectedCustomer.last_login &&
                  Date.now() - new Date(selectedCustomer.last_login).getTime() < 7 * 24 * 60 * 60 * 1000
                    ? "border border-emerald-200 bg-emerald-50"
                    : selectedCustomer.last_login
                    ? "border border-amber-200 bg-amber-50"
                    : "border border-slate-200 bg-slate-100"
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">Account Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedCustomer.last_login
                      ? `Last active ${timeAgo(selectedCustomer.last_login)}`
                      : "Never logged in"}
                  </p>
                </div>
                <div
                  className={`h-4 w-4 rounded-full shadow-lg ${
                    selectedCustomer.last_login &&
                    Date.now() - new Date(selectedCustomer.last_login).getTime() < 7 * 24 * 60 * 60 * 1000
                      ? "bg-emerald-500 shadow-emerald-200"
                      : selectedCustomer.last_login
                      ? "bg-amber-500 shadow-amber-200"
                      : "bg-slate-400 shadow-slate-200"
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedCustomer.email) {
                    window.location.href = `mailto:${selectedCustomer.email}`;
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
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