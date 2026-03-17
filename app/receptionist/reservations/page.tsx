"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";
import type { Reservation, Room } from "../../../utils/types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type FilterType = "all" | "Pending" | "Confirmed" | "Cancelled";

interface ReservationFormData {
  room: number | "";
  customer_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: "Pending" | "Confirmed" | "Cancelled";
}

// ==================== MAIN COMPONENT ====================

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  // Fetch reservations
  const {
    data: reservations = [],
    isLoading,
  } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/",
      );
      return res.data.data ?? [];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return res.data.data ?? [];
    },
  });

  // Update reservation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Reservation["status"] }) => {
      const res = await apiClient.put<ApiResponse<Reservation>>(
        `/api/staff/reservations/${id}/`,
        { status },
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    },
  });

  const activeRooms = useMemo(
    () => rooms.filter((r) => r.status === "active"),
    [rooms],
  );

  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) =>
      filter === "all" ? true : reservation.status === filter,
    );
  }, [reservations, filter]);

  // Status color mapping
  const statusColors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Confirmed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  // Filter tabs configuration
  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  // Get count for each filter
  const getFilterCount = (filterKey: FilterType): number => {
    if (filterKey === "all") return reservations.length;
    return reservations.filter((r) => r.status === filterKey).length;
  };

  // Handle status update
  const handleStatusUpdate = (id: number, status: Reservation["status"]) => {
    updateStatusMutation.mutate({ id, status });
  };

  const isRoomAvailable = (
    roomId: number,
    checkIn: string,
    checkOut: string,
  ): boolean => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!(start instanceof Date) || !(end instanceof Date)) return false;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    if (end <= start) return false;

    const conflicts = reservations.some((r) => {
      if (r.room !== roomId) return false;
      if (r.status === "Cancelled") return false;
      const rStart = new Date(r.check_in);
      const rEnd = new Date(r.check_out);
      if (Number.isNaN(rStart.getTime()) || Number.isNaN(rEnd.getTime())) return false;
      // overlap if start < rEnd && end > rStart
      return start < rEnd && end > rStart;
    });
    return !conflicts;
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
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + New Reservation
        </button>
      </div>

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
                  Guest
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
                  Room
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
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading reservations...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                      <div>{reservation.phone || "N/A"}</div>
                      <div className="text-slate-500">
                        {reservation.email || "N/A"}
                      </div>
                    </td>

                    {/* Check-in Date */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.check_in}
                    </td>

                    {/* Check-out Date */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.check_out}
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3 text-slate-700">
                      {roomById.get(reservation.room)?.name ??
                        reservation.room_name ??
                        `Room #${reservation.room}`}
                    </td>

                    {/* Guests */}
                    <td className="px-4 py-3 text-slate-700">
                      {reservation.guests ?? 0}
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
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReservation(reservation)}
                          className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                        >
                          View
                        </button>
                      {reservation.status === "Pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                reservation.id,
                                "Confirmed"
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
                                "Cancelled"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
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

      {isCreateOpen && (
        <ReservationModal
          activeRooms={activeRooms}
          reservations={reservations}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (payload) => {
            if (!payload.room) {
              toast.error("Please select a room");
              return;
            }
            if (!payload.check_in || !payload.check_out) {
              toast.error("Please select check-in and check-out dates");
              return;
            }
            if (!isRoomAvailable(payload.room, payload.check_in, payload.check_out)) {
              toast.error("Selected room is not available for these dates");
              return;
            }
            await apiClient.post<ApiResponse<Reservation>>(
              "/api/staff/reservations/",
              {
                room: payload.room,
                customer_name: payload.customer_name,
                email: payload.email,
                phone: payload.phone,
                check_in: payload.check_in,
                check_out: payload.check_out,
                guests: payload.guests,
                status: payload.status,
              },
            );
            toast.success("Reservation created successfully!");
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
            setIsCreateOpen(false);
          }}
        />
      )}

      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          room={roomById.get(selectedReservation.room) ?? null}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </div>
  );
}

function ReservationModal({
  activeRooms,
  reservations,
  onClose,
  onCreate,
}: {
  activeRooms: Room[];
  reservations: Reservation[];
  onClose: () => void;
  onCreate: (payload: ReservationFormData) => Promise<void>;
}) {
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const [values, setValues] = useState<ReservationFormData>({
    room: "",
    customer_name: "",
    email: "",
    phone: "",
    check_in: "",
    check_out: "",
    guests: 1,
    status: "Pending",
  });
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const canCheck =
    values.room !== "" && values.check_in !== "" && values.check_out !== "";

  const checkAvailability = () => {
    if (!canCheck || values.room === "") return;
    const start = new Date(values.check_in);
    const end = new Date(values.check_out);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setAvailable(false);
      return;
    }
    const conflicts = reservations.some((r) => {
      if (r.room !== values.room) return false;
      if (r.status === "Cancelled") return false;
      const rStart = new Date(r.check_in);
      const rEnd = new Date(r.check_out);
      if (Number.isNaN(rStart.getTime()) || Number.isNaN(rEnd.getTime())) return false;
      return start < rEnd && end > rStart;
    });
    setAvailable(!conflicts);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await onCreate(values);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to create reservation";
      toast.error(message);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-start justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              New Reservation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a room and dates, then create the reservation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Guest Name</label>
              <input
                value={values.customer_name}
                onChange={(e) =>
                  setValues((p) => ({ ...p, customer_name: e.target.value }))
                }
                className={inputClass}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Phone</label>
              <input
                value={values.phone}
                onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
                placeholder="0771234567"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Room</label>
              <select
                value={values.room === "" ? "" : String(values.room)}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : "";
                  setValues((p) => ({ ...p, room: v }));
                  setAvailable(null);
                }}
                className={inputClass}
                required
              >
                <option value="">Select an active room</option>
                {activeRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.category} · LKR {Number(r.price).toLocaleString("en-LK")}
                  </option>
                ))}
              </select>
            </div>

            <DateField
              label="Check-in"
              value={values.check_in}
              onChange={(v) => {
                setValues((p) => ({ ...p, check_in: v }));
                setAvailable(null);
              }}
            />
            <DateField
              label="Check-out"
              value={values.check_out}
              onChange={(v) => {
                setValues((p) => ({ ...p, check_out: v }));
                setAvailable(null);
              }}
            />

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Guests</label>
              <input
                type="number"
                min={1}
                value={values.guests}
                onChange={(e) =>
                  setValues((p) => ({ ...p, guests: Number(e.target.value ?? 1) }))
                }
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <select
                value={values.status}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    status: e.target.value as ReservationFormData["status"],
                  }))
                }
                className={inputClass}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border bg-white shadow-sm p-4">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                Availability
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Check if the selected room is available for your date range.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {available !== null && (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {available ? "Available" : "Not available"}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setChecking(true);
                  try {
                    checkAvailability();
                  } finally {
                    setChecking(false);
                  }
                }}
                disabled={!canCheck || checking}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {checking ? "Checking..." : "Check"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReservationDetailsModal({
  reservation,
  room,
  onClose,
}: {
  reservation: Reservation;
  room: Room | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Reservation Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 rounded-xl p-4 text-xs">
          <Row label="Reservation ID" value={`#${reservation.id}`} />
          <Row label="Guest" value={reservation.customer_name} />
          <Row label="Email" value={reservation.email} />
          <Row label="Phone" value={reservation.phone} />
          <Row
            label="Room"
            value={room ? `${room.name} (${room.category})` : `#${reservation.room}`}
          />
          <Row label="Check-in" value={reservation.check_in} />
          <Row label="Check-out" value={reservation.check_out} />
          <Row label="Guests" value={String(reservation.guests)} />
          <Row label="Status" value={reservation.status} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right break-words">
        {value}
      </span>
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
        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          required
        />
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}