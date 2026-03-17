"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

// ==================== TYPES ====================

interface Reservation {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  check_in: string;
  check_out: string;
  room_type: string;
  number_of_rooms: number;
  status: "pending" | "confirmed" | "cancelled";
  total_price: number;
  created_at: string;
}

interface RoomType {
  id: number;
  name: string;
  price: number;
  available_rooms: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type FilterType = "all" | "pending" | "confirmed" | "cancelled";

interface ReservationFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  check_in: string;
  check_out: string;
  room_type_id: string;
  number_of_rooms: number;
}

// ==================== MAIN COMPONENT ====================

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch reservations
  const {
    data: reservations = [],
    isLoading,
  } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/"
      );
      return res.data?.data || [];
    },
  });

  // Fetch room types
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<RoomType[]>>(
        "/api/staff/room-types/"
      );
      return res.data?.data || [];
    },
  });

  // Update reservation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiClient.patch(`/api/staff/reservations/${id}/`, {
        status,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  // Filter reservations
  const filteredReservations = reservations.filter((reservation) =>
    filter === "all" ? true : reservation.status === filter
  );

  // Status color mapping
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // Filter tabs configuration
  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  // Get count for each filter
  const getFilterCount = (filterKey: FilterType): number => {
    if (filterKey === "all") return reservations.length;
    return reservations.filter((r) => r.status === filterKey).length;
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    toast.success("Reservation created successfully!");
  };

  // Handle status update
  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Safe date format
  const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Safe price format
  const formatPrice = (price: number | undefined | null): string => {
    return (price ?? 0).toLocaleString();
  };

  return (
    <div className="space-y-5">

      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            📋 Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage customer reservations
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {showForm ? "✕ Close" : "+ New Reservation"}
        </button>
      </div>

      {/* ========== NEW RESERVATION FORM ========== */}
      {showForm && (
        <ReservationForm
          roomTypes={roomTypes}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* ========== FILTER TABS ========== */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label} ({getFilterCount(tab.key)})
          </button>
        ))}
      </div>

      {/* ========== RESERVATIONS TABLE ========== */}
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
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Room Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Rooms
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Price
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
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading reservations...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No reservations found
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-medium text-slate-900">
                      #{reservation.id ?? 0}
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.customer_name || "N/A"}
                    </td>

                    {/* Contact Info */}
                    <td className="px-4 py-3 text-slate-600">
                      <div>{reservation.customer_phone || "N/A"}</div>
                      <div className="text-slate-500">
                        {reservation.customer_email || "N/A"}
                      </div>
                    </td>

                    {/* Check-in Date */}
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(reservation.check_in)}
                    </td>

                    {/* Check-out Date */}
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(reservation.check_out)}
                    </td>

                    {/* Room Type */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.room_type || "N/A"}
                    </td>

                    {/* Number of Rooms */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.number_of_rooms ?? 0}
                    </td>

                    {/* Total Price */}
                    <td className="px-4 py-3 font-medium text-slate-900">
                      LKR {formatPrice(reservation.total_price)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[reservation.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {reservation.status || "unknown"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3">
                      {reservation.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.id,
                                "confirmed"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.id,
                                "cancelled"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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

// ==================== FORM COMPONENT ====================

interface ReservationFormProps {
  roomTypes: RoomType[];
  onSuccess: () => void;
}

function ReservationForm({ roomTypes, onSuccess }: ReservationFormProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    check_in: "",
    check_out: "",
    room_type_id: "",
    number_of_rooms: 1,
  });

  // Create reservation mutation
  const createMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const res = await apiClient.post("/api/staff/reservations/", data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create reservation");
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Handle input change
  const handleChange = (
    field: keyof ReservationFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">
        New Reservation
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Customer Name */}
        <input
          type="text"
          placeholder="Customer Name"
          required
          value={formData.customer_name}
          onChange={(e) => handleChange("customer_name", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          required
          value={formData.customer_email}
          onChange={(e) => handleChange("customer_email", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />

        {/* Phone */}
        <input
          type="tel"
          placeholder="Phone"
          required
          value={formData.customer_phone}
          onChange={(e) => handleChange("customer_phone", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />

        {/* Room Type */}
        <select
          required
          value={formData.room_type_id}
          onChange={(e) => handleChange("room_type_id", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Select Room Type</option>
          {roomTypes.map((roomType) => (
            <option key={roomType.id} value={roomType.id}>
              {roomType.name || "Unknown"} — LKR{" "}
              {(roomType.price ?? 0).toLocaleString()} (
              {roomType.available_rooms ?? 0} available)
            </option>
          ))}
        </select>

        {/* Check-in Date */}
        <input
          type="date"
          required
          value={formData.check_in}
          onChange={(e) => handleChange("check_in", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />

        {/* Check-out Date */}
        <input
          type="date"
          required
          value={formData.check_out}
          onChange={(e) => handleChange("check_out", e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />

        {/* Number of Rooms */}
        <input
          type="number"
          min="1"
          placeholder="Number of Rooms"
          required
          value={formData.number_of_rooms}
          onChange={(e) => handleChange("number_of_rooms", +e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {createMutation.isPending ? "Creating..." : "Create Reservation"}
      </button>
    </form>
  );
}