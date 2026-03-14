"use client";

import { Reservation } from "../../../utils/types";

interface Props {
  items: Reservation[];
  loading?: boolean;
  onEdit?: (item: Reservation) => void;
  onDelete?: (item: Reservation) => void;
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function statusStyles(status: string) {
  switch (status) {
    case "Confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "Cancelled":
      return "bg-rose-50 text-rose-700";
    case "Completed":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function ReservationsTable({
  items,
  loading,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b px-4 py-3">Customer</th>
              <th className="border-b px-4 py-3">Room</th>
              <th className="border-b px-4 py-3">Check-in</th>
              <th className="border-b px-4 py-3">Check-out</th>
              <th className="border-b px-4 py-3 text-right">Guests</th>
              <th className="border-b px-4 py-3">Status</th>
              <th className="border-b px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="border-b px-4 py-3">
                    <div className="h-3 w-32 rounded bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3">
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3 text-right">
                    <div className="ml-auto h-3 w-8 rounded bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3">
                    <div className="h-5 w-16 rounded-full bg-slate-100" />
                  </td>
                  <td className="border-b px-4 py-3 text-right">
                    <div className="ml-auto h-3 w-16 rounded bg-slate-100" />
                  </td>
                </tr>
              ))}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-xs text-slate-500"
                >
                  No reservations found.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="border-b px-4 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {item.customer_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.email} · {item.phone}
                      </span>
                    </div>
                  </td>
                  <td className="border-b px-4 py-2.5 text-sm text-slate-700">
                    {item.room_name ?? `Room ${item.room}`}
                  </td>
                  <td className="border-b px-4 py-2.5 text-xs text-slate-600">
                    {formatDate(item.check_in)}
                  </td>
                  <td className="border-b px-4 py-2.5 text-xs text-slate-600">
                    {formatDate(item.check_out)}
                  </td>
                  <td className="border-b px-4 py-2.5 text-right text-sm text-slate-700">
                    {item.guests}
                  </td>
                  <td className="border-b px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="border-b px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="rounded-full border border-rose-200 px-3 py-1 font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
