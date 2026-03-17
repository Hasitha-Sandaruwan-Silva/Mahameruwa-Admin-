"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";

// ==================== TYPES ====================

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  floor: number;
  status: "available" | "occupied" | "maintenance" | "reserved";
  price_per_night: number;
  capacity: number;
  amenities: string[];
  current_booking?: {
    customer_name: string;
    check_out: string;
  };
}

interface RoomType {
  id: number;
  name: string;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  price: number;
  description: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type StatusFilter = "all" | "available" | "occupied" | "maintenance" | "reserved";

// ==================== MAIN COMPONENT ====================

export default function RoomsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch rooms
  const {
    data: rooms = [],
    isLoading: roomsLoading,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>(
        "/api/staff/rooms/"
      );
      return res.data?.data || [];
    },
  });

  // Fetch room types
  const {
    data: roomTypes = [],
    isLoading: typesLoading,
  } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<RoomType[]>>(
        "/api/staff/room-types/"
      );
      return res.data?.data || [];
    },
  });

  // Safe format helpers
  const formatPrice = (price: number | undefined | null): string => {
    return (price ?? 0).toLocaleString();
  };

  const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesStatus =
      statusFilter === "all" ? true : room.status === statusFilter;

    const matchesType =
      roomTypeFilter === "all" ? true : room.room_type === roomTypeFilter;

    const matchesSearch =
      searchTerm === "" ||
      (room.room_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.room_type || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  // Status colors
  const statusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    occupied: "bg-blue-100 text-blue-700",
    maintenance: "bg-amber-100 text-amber-700",
    reserved: "bg-purple-100 text-purple-700",
  };

  // Status dot colors
  const statusDotColors: Record<string, string> = {
    available: "bg-emerald-500",
    occupied: "bg-blue-500",
    maintenance: "bg-amber-500",
    reserved: "bg-purple-500",
  };

  // Filter tabs
  const statusTabs: { key: StatusFilter; label: string; icon: string }[] = [
    { key: "all", label: "All Rooms", icon: "🏨" },
    { key: "available", label: "Available", icon: "✅" },
    { key: "occupied", label: "Occupied", icon: "👥" },
    { key: "reserved", label: "Reserved", icon: "📌" },
    { key: "maintenance", label: "Maintenance", icon: "🔧" },
  ];

  // Get count for status
  const getStatusCount = (status: StatusFilter): number => {
    if (status === "all") return rooms.length;
    return rooms.filter((r) => r.status === status).length;
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setRoomTypeFilter("all");
    setSearchTerm("");
  };

  // Check if filters active
  const hasActiveFilters =
    statusFilter !== "all" || roomTypeFilter !== "all" || searchTerm !== "";

  // Calculate occupancy rate
  const occupancyRate =
    rooms.length > 0
      ? Math.round(
          (rooms.filter((r) => r.status === "occupied").length / rooms.length) *
            100
        )
      : 0;

  const isLoading = roomsLoading || typesLoading;

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

      {/* ========== ROOM TYPE OVERVIEW CARDS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {typesLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-2xl border border-slate-200 p-4 h-32"
            />
          ))
        ) : (
          roomTypes.map((type) => {
            const totalRooms = type.total_rooms ?? 0;
            const availableRooms = type.available_rooms ?? 0;
            const availablePercent =
              totalRooms > 0
                ? Math.round((availableRooms / totalRooms) * 100)
                : 0;

            return (
              <div
                key={type.id}
                onClick={() => setRoomTypeFilter(type.name || "")}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  roomTypeFilter === type.name
                    ? "border-blue-400 ring-1 ring-blue-200"
                    : "border-slate-200"
                }`}
              >
                {/* Type Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {type.name || "Unknown"}
                  </h3>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {availableRooms}/{totalRooms}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {type.description || "No description"}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2">
                  <div
                    className="h-1.5 bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${availablePercent}%` }}
                  />
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    LKR {formatPrice(type.price)}
                  </p>
                  <p className="text-xs text-slate-500">per night</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========== FILTER SECTION ========== */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200"
              }`}
            >
              {tab.icon} {tab.label} ({getStatusCount(tab.key)})
            </button>
          ))}
        </div>

        {/* Room Type Dropdown */}
        <select
          value={roomTypeFilter}
          onChange={(e) => setRoomTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          {roomTypes.map((type) => (
            <option key={type.id} value={type.name || ""}>
              {type.name || "Unknown"}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* ========== ROOMS GRID ========== */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-2xl border border-slate-200 p-4 h-48"
            />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-medium text-slate-900">
            No rooms found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm
              ? "No rooms match your search"
              : "No rooms found with selected filters"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all"
            >

              {/* Room Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      statusDotColors[room.status] || "bg-slate-400"
                    }`}
                  />
                  <h3 className="text-lg font-bold text-slate-900">
                    {room.room_number || "N/A"}
                  </h3>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[room.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {room.status || "unknown"}
                </span>
              </div>

              {/* Room Type Badge */}
              <div className="mb-3">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                  {room.room_type || "Unknown"}
                </span>
              </div>

              {/* Room Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Floor</span>
                  <span className="font-medium text-slate-900">
                    Floor {room.floor ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Capacity</span>
                  <span className="font-medium text-slate-900">
                    {room.capacity ?? 0}{" "}
                    {(room.capacity ?? 0) === 1 ? "guest" : "guests"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Price/Night</span>
                  <span className="font-bold text-blue-700">
                    LKR {formatPrice(room.price_per_night)}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                      >
                        {amenity || ""}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Current Guest Info (Occupied) */}
              {room.status === "occupied" && room.current_booking && (
                <div className="mt-3 pt-3 border-t border-slate-200 bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    👤 Current Guest
                  </p>
                  <p className="text-xs font-semibold text-slate-900">
                    {room.current_booking.customer_name || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Checkout: {formatDate(room.current_booking.check_out)}
                  </p>
                </div>
              )}

              {/* Maintenance Notice */}
              {room.status === "maintenance" && (
                <div className="mt-3 pt-3 border-t border-slate-200 bg-amber-50 rounded-lg p-2">
                  <p className="text-xs text-amber-600 font-medium">
                    🔧 Under Maintenance
                  </p>
                </div>
              )}

              {/* Reserved Notice */}
              {room.status === "reserved" && (
                <div className="mt-3 pt-3 border-t border-slate-200 bg-purple-50 rounded-lg p-2">
                  <p className="text-xs text-purple-600 font-medium">
                    📌 Reserved
                  </p>
                </div>
              )}

              {/* Book Now Button (Available) */}
              {room.status === "available" && (
                <button className="w-full mt-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                  Book Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========== BOTTOM SUMMARY ========== */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Room Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            {
              label: "Total Rooms",
              value: rooms.length,
              color: "text-slate-900",
            },
            {
              label: "Available",
              value: getStatusCount("available"),
              color: "text-emerald-600",
            },
            {
              label: "Occupied",
              value: getStatusCount("occupied"),
              color: "text-blue-600",
            },
            {
              label: "Reserved",
              value: getStatusCount("reserved"),
              color: "text-purple-600",
            },
            {
              label: "Occupancy Rate",
              value: `${occupancyRate}%`,
              color: "text-blue-700",
            },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}