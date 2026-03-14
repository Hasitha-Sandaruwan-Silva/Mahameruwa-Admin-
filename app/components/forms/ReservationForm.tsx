"use client";

import { FormEvent, useState } from "react";
import { Reservation } from "../../../utils/types";
import { Room } from "../../../utils/types";

export interface ReservationFormValues {
  room: number;
  customer_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
}

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-slate-400 pointer-events-none"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface Props {
  rooms: Room[];
  existingReservations?: Reservation[];
  initialValues?: Partial<Reservation>;
  onSubmit: (values: ReservationFormValues) => Promise<void> | void;
  submitLabel?: string;
  isEdit?: boolean;
}

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS < bE && aE > bS;
}

export function ReservationForm({
  rooms,
  existingReservations = [],
  initialValues,
  onSubmit,
  submitLabel = "Save",
  isEdit = false,
}: Props) {
  const [values, setValues] = useState<ReservationFormValues>({
    room: initialValues?.room ?? (rooms[0]?.id ?? 0),
    customer_name: initialValues?.customer_name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    check_in: initialValues?.check_in ?? "",
    check_out: initialValues?.check_out ?? "",
    guests: initialValues?.guests ?? 1,
    status: initialValues?.status ?? "Pending",
  });
  const [submitting, setSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const handleChange = (
    field: keyof ReservationFormValues,
    value: string | number,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setAvailabilityError(null);
  };

  const checkAvailability = (): boolean => {
    if (!values.check_in || !values.check_out) return true;
    const activeReservations = existingReservations.filter(
      (r) =>
        r.room === values.room &&
        r.status !== "Cancelled" &&
        (isEdit ? r.id !== initialValues?.id : true),
    );
    const overlaps = activeReservations.some((r) =>
      datesOverlap(values.check_in, values.check_out, r.check_in, r.check_out),
    );
    if (overlaps) {
      setAvailabilityError(
        "This room is not available for the selected dates. Please choose different dates or another room.",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAvailabilityError(null);
    if (
      !values.room ||
      !values.customer_name ||
      !values.email ||
      !values.phone ||
      !values.check_in ||
      !values.check_out ||
      !values.guests
    ) {
      return;
    }
    if (new Date(values.check_out) <= new Date(values.check_in)) {
      setAvailabilityError("Check-out must be after check-in.");
      return;
    }
    if (!checkAvailability()) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRooms = rooms.filter((r) => r.status === "active");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Room</label>
          <select
            value={values.room || ""}
            onChange={(e) => handleChange("room", Number(e.target.value))}
            required
            disabled={activeRooms.length === 0}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">
              {activeRooms.length === 0
                ? "No active rooms"
                : "Select room"}
            </option>
            {activeRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} - {room.category} (LKR {room.price.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Customer Name
          </label>
          <input
            type="text"
            value={values.customer_name}
            onChange={(e) => handleChange("customer_name", e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Phone</label>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="0771234567"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Check-in
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3">
              <CalendarIcon />
            </span>
            <input
              type="date"
              value={values.check_in}
              onChange={(e) => handleChange("check_in", e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Check-out
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3">
              <CalendarIcon />
            </span>
            <input
              type="date"
              value={values.check_out}
              onChange={(e) => handleChange("check_out", e.target.value)}
              required
              min={values.check_in}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Guests</label>
          <input
            type="number"
            min={1}
            value={values.guests}
            onChange={(e) =>
              handleChange("guests", Number(e.target.value) || 1)
            }
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Status</label>
          <select
            value={values.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {availabilityError && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {availabilityError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
