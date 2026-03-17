"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import type { Reservation, Room } from "../../../utils/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== MAIN COMPONENT ====================

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // Fetch rooms
  const {
    data: rooms = [],
    isLoading: roomsLoading,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>(
        "/api/staff/rooms/",
      );
      return res.data?.data || [];
    },
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/",
      );
      return res.data?.data || [];
    },
  });

  const isLoading = roomsLoading || reservationsLoading;

  const range = useMemo(() => {
    const start = checkIn ? new Date(checkIn) : null;
    const end = checkOut ? new Date(checkOut) : null;
    const valid =
      !!start &&
      !!end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start;
    return { start, end, valid };
  }, [checkIn, checkOut]);

  const isAvailable = (roomId: number) => {
    if (!range.valid || !range.start || !range.end) return null;
    const conflict = reservations.some((r) => {
      if (r.room !== roomId) return false;
      if (r.status === "Cancelled") return false;
      const rStart = new Date(r.check_in);
      const rEnd = new Date(r.check_out);
      if (Number.isNaN(rStart.getTime()) || Number.isNaN(rEnd.getTime())) return false;
      return range.start < rEnd && range.end > rStart;
    });
    return !conflict;
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        searchTerm === "" ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [rooms, searchTerm]);

  return (
    <div className="space-y-5">

      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">🛏 Rooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View room availability and status
          </p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search room number or type..."
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

      {/* ========== AVAILABILITY CHECK ========== */}
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <DateField label="Check-in" value={checkIn} onChange={setCheckIn} />
          <DateField label="Check-out" value={checkOut} onChange={setCheckOut} />
          <div className="text-xs text-slate-500 pb-2">
            {range.valid
              ? "Showing availability for selected date range."
              : "Select a valid date range to check availability."}
          </div>
        </div>
      </div>

      {/* ========== ROOMS TABLE ========== */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading rooms...
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-medium text-slate-900">
            No rooms found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? "No rooms match your search" : "No rooms found"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Price (LKR)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Availability
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => {
                  const avail = isAvailable(room.id);
                  const availBadge =
                    avail === null
                      ? "bg-slate-100 text-slate-700"
                      : avail
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700";
                  const availText =
                    avail === null ? "Select dates" : avail ? "Available" : "Unavailable";
                  return (
                    <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {room.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{room.category}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {room.capacity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 font-medium">
                        {Number(room.price).toLocaleString("en-LK")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            room.status === "active"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {room.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${availBadge}`}
                        >
                          {availText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}