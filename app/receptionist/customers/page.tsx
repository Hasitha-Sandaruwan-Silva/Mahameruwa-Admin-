"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface BookingRow {
  id: number;
  full_name: string;
  email: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  room_number: string;
  room_category: string;
  created_at: string;
}

interface CustomerRow {
  key: string; // email-based key
  name: string;
  email: string;
  phone: string | null;
  registration_date: string | null;
  total_bookings: number;
  last_visit: string | null;
  statuses: Record<string, number>;
  bookings: BookingRow[];
}

// ==================== MAIN COMPONENT ====================

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRow | null>(null);

  // We don't have a dedicated customers endpoint in this backend.
  // So we derive customer list from all bookings.
  const {
    data: customers = [],
    isLoading,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BookingRow[]>>(
        "/api/staff/bookings/",
      );
      const rows = res.data.data ?? [];

      const byEmail = new Map<string, CustomerRow>();
      for (const b of rows) {
        const email = (b.email ?? "").trim().toLowerCase();
        if (!email) continue;
        const existing = byEmail.get(email);
        const name = (b.full_name ?? "").trim();
        const createdAt = b.created_at ?? null;
        const lastVisit = b.check_in ?? null;

        if (!existing) {
          byEmail.set(email, {
            key: email,
            name: name || email,
            email,
            phone: null,
            registration_date: createdAt,
            total_bookings: 1,
            last_visit: lastVisit,
            statuses: { [b.status]: 1 },
            bookings: [b],
          });
        } else {
          existing.total_bookings += 1;
          existing.bookings.push(b);
          existing.statuses[b.status] = (existing.statuses[b.status] ?? 0) + 1;
          if (createdAt && (!existing.registration_date || createdAt < existing.registration_date)) {
            existing.registration_date = createdAt;
          }
          if (lastVisit && (!existing.last_visit || lastVisit > existing.last_visit)) {
            existing.last_visit = lastVisit;
          }
          if (!existing.name && name) existing.name = name;
        }
      }

      return Array.from(byEmail.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
    retry: 1,
    meta: {
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load customers";
        toast.error(message);
      },
    },
  });

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    if (searchTerm === "") return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search)
    );
  });

  // Stats
  const totalCustomers = customers.length;
  const totalBookings = customers.reduce((sum, c) => sum + c.total_bookings, 0);
  const pendingCount = customers.reduce((sum, c) => sum + (c.statuses["Pending"] ?? 0), 0);
  const confirmedCount = customers.reduce((sum, c) => sum + (c.statuses["Confirmed"] ?? 0), 0);
  const cancelledCount = customers.reduce((sum, c) => sum + (c.statuses["Cancelled"] ?? 0), 0);

  return (
    <div className="space-y-5">

      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            👥 Customers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View customer information
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search name, email, phone, NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 px-4 py-2 pl-9 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Customers",
            value: totalCustomers,
            color: "bg-blue-50",
            text: "text-blue-700",
            icon: "👥",
          },
          {
            label: "Total Bookings",
            value: totalBookings,
            color: "bg-emerald-50",
            text: "text-emerald-700",
            icon: "📦",
          },
          {
            label: "Confirmed",
            value: confirmedCount,
            color: "bg-violet-50",
            text: "text-violet-700",
            icon: "✅",
          },
          {
            label: "Pending / Cancelled",
            value: `${pendingCount} / ${cancelledCount}`,
            color: "bg-amber-50",
            text: "text-amber-700",
            icon: "⏳",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-2xl p-4 border border-slate-200`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className={`text-xs font-medium ${stat.text} mt-0.5`}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ========== CUSTOMER TABLE ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">

            {/* Header */}
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Total Bookings
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Last Visit
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Booking Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {searchTerm
                      ? "No customers match your search"
                      : "No customers found"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.key}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">
                          {customer.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-600">{customer.email}</td>

                    {/* Total Bookings */}
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {customer.total_bookings}
                      </span>
                    </td>

                    {/* Last Visit */}
                    <td className="px-4 py-3 text-slate-700">
                      {customer.last_visit ?? "N/A"}
                    </td>

                    {/* Status summary */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          (customer.statuses["Confirmed"] ?? 0) > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {`Confirmed ${customer.statuses["Confirmed"] ?? 0} · Pending ${
                          customer.statuses["Pending"] ?? 0
                        } · Cancelled ${customer.statuses["Cancelled"] ?? 0}`}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CUSTOMER DETAIL MODAL ========== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Customer Details
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.email}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 bg-slate-50 rounded-xl p-4">
              {[
                { label: "Email", value: selectedCustomer.email },
                {
                  label: "Total Bookings",
                  value: selectedCustomer.total_bookings.toString(),
                },
                {
                  label: "Last Visit",
                  value: selectedCustomer.last_visit ?? "N/A",
                },
                {
                  label: "Member Since",
                  value: selectedCustomer.registration_date ?? "N/A",
                },
              ].map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-500">{detail.label}</span>
                  <span className="font-medium text-slate-900">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}