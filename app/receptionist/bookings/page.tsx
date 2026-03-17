"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | string;

interface Booking {
  id: number;
  full_name: string;
  email: string;
  check_in: string;
  check_out?: string;
  guests: number;
  status: BookingStatus;
  room_number: string;
  room_category: string;
  created_at?: string;
}

type FilterType = "all" | "Pending" | "Confirmed" | "Cancelled";

// ==================== MAIN COMPONENT ====================

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch bookings
  const {
    data: bookings = [],
    isLoading,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Booking[]>>(
        "/api/staff/bookings/",
      );
      return res.data.data ?? [];
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      const res = await apiClient.patch<ApiResponse<unknown>>(
        `/api/staff/bookings/${id}/update-status/`,
        {
        status,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Booking status updated!");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    },
  });

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" ? true : booking.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      booking.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room_number.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Status colors
  const statusColors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Confirmed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  // Filter tabs
  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  // Get count for filter
  const getFilterCount = (filterKey: FilterType): number => {
    if (filterKey === "all") return bookings.length;
    return bookings.filter((b) => b.status === filterKey).length;
  };

  // Handle status update
  const handleStatusUpdate = (id: number, status: BookingStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-5">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            📦 Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage all bookings
          </p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, email, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-4 py-2 pl-9 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-blue-500"
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

      {/* ========== STATS SUMMARY ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Bookings",
            value: bookings.length,
            color: "bg-blue-50",
            text: "text-blue-700",
          },
          {
            label: "Pending",
            value: bookings.filter((b) => b.status === "Pending").length,
            color: "bg-emerald-50",
            text: "text-emerald-700",
          },
          {
            label: "Confirmed",
            value: bookings.filter((b) => b.status === "Confirmed").length,
            color: "bg-amber-50",
            text: "text-amber-700",
          },
          {
            label: "Cancelled",
            value: bookings.filter((b) => b.status === "Cancelled").length,
            color: "bg-red-50",
            text: "text-red-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-2xl p-4 border border-slate-200`}
          >
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className={`text-xs font-medium ${stat.text} mt-0.5`}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ========== FILTER TABS ========== */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === tab.key
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label} ({getFilterCount(tab.key)})
          </button>
        ))}
      </div>

      {/* ========== BOOKINGS TABLE ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            
            {/* Table Header */}
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Room
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Guests
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading state
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {searchTerm
                      ? "No bookings match your search"
                      : "No bookings found"}
                  </td>
                </tr>
              ) : (
                // Booking rows
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-medium text-slate-900">
                      #{booking.id}
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-3 text-slate-700">
                      {booking.full_name}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-600">{booking.email}</td>

                    {/* Room */}
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{booking.room_number}</div>
                      <div className="text-slate-500">{booking.room_category}</div>
                    </td>

                    {/* Check-in */}
                    <td className="px-4 py-3 text-slate-700">
                      {booking.check_in}
                    </td>

                    {/* Check-out */}
                    <td className="px-4 py-3 text-slate-700">
                      {booking.check_out ?? "—"}
                    </td>

                    {/* Guests */}
                    <td className="px-4 py-3 text-slate-700">{booking.guests}</td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[booking.status] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        
                        {/* Confirm button */}
                        {booking.status === "Pending" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking.id, "Confirmed")
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Cancel button */}
                        {booking.status !== "Cancelled" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking.id, "Cancelled")
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}