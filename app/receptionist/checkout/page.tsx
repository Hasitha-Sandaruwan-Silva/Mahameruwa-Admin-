"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { authStorage } from "../../../utils/auth";
import toast from "react-hot-toast";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/staff";

interface Reservation {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  room: number;
  room_number: string;
  room_category: string;
  check_in: string;
  check_out: string;
  status: string;
  guests: number;
  created_at?: string;
}

export default function CheckOutPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const getAuthToken = useCallback(() => {
    try {
      if (typeof authStorage.getToken === "function") {
        const storedToken = authStorage.getToken();
        if (storedToken) return storedToken;
      }

      return (
        localStorage.getItem("access") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("staff_token") ||
        ""
      );
    } catch (error) {
      console.error("Token read error:", error);
      return "";
    }
  }, []);

  const fetchReservations = useCallback(
    async (providedToken?: string) => {
      const authToken = providedToken || getAuthToken();

      if (!authToken) {
        setLoading(false);
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`${API}/reservations/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("RAW RESPONSE:", text);
          throw new Error("Server returned invalid response. Check API URL.");
        }

        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to fetch reservations");
        }

        if (data.success) {
          const reservationList = data.data || [];

          const filtered = reservationList.filter(
            (r: Reservation) => r.status === "Checked In"
          );

          setReservations(filtered);
        } else {
          toast.error(data.message || "Failed to fetch reservations");
        }
      } catch (error: any) {
        console.error("Fetch reservations error:", error);
        toast.error(error.message || "Failed to fetch reservations");
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  useEffect(() => {
    const t = getAuthToken();
    setToken(t);

    if (t) {
      fetchReservations(t);
    } else {
      setLoading(false);
    }
  }, [fetchReservations, getAuthToken]);

  const handleCheckOut = async (reservation: Reservation) => {
    const authToken = token || getAuthToken();

    if (!authToken) {
      toast.error("Authentication token missing. Please login again.");
      return;
    }

    setProcessingId(reservation.id);

    try {
      const res = await fetch(`${API}/reservations/${reservation.id}/check-out/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("RAW CHECK-OUT RESPONSE:", text);
        throw new Error("Server returned invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || "Check-out failed");
      }

      if (data.success) {
        toast.success(`${reservation.customer_name} checked out successfully!`);
        setSelectedReservation(null);
        fetchReservations(authToken);
      } else {
        toast.error(data.message || "Check-out failed");
      }
    } catch (error: any) {
      console.error("Check-out error:", error);
      toast.error(error.message || "Check-out failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReservations = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return reservations.filter((r) => {
      return (
        r.customer_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.room_number?.toLowerCase().includes(q) ||
        r.room_category?.toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        r.status?.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "Checked In": "bg-blue-100 text-blue-700",
      Confirmed: "bg-emerald-100 text-emerald-700",
      Pending: "bg-amber-100 text-amber-700",
      Cancelled: "bg-red-100 text-red-700",
      "Checked Out": "bg-slate-200 text-slate-700",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          styles[status] || "bg-slate-100 text-slate-700"
        }`}
      >
        {status}
      </span>
    );
  };

  const getNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-CA");
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🔓 Check-Out Desk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Currently checked-in guests process කරන්න
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <SummaryCard
            label="Checked In"
            value={String(filteredReservations.length)}
            color="blue"
          />
          <SummaryCard
            label="Ready to Checkout"
            value={String(filteredReservations.length)}
            color="rose"
          />
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by guest name, email, phone, room number, status or reservation ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-5xl">🏁</p>
          <h3 className="mt-3 text-lg font-semibold text-slate-700">
            No guests ready for check-out
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            There are no currently checked-in guests at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                {/* Left */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {reservation.customer_name}
                        </h2>
                        {statusBadge(reservation.status)}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          #{reservation.id}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {reservation.email} • {reservation.phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoBox
                      label="Room"
                      value={`Room ${reservation.room_number || "N/A"}`}
                      subValue={reservation.room_category || "No category"}
                    />
                    <InfoBox
                      label="Check-In"
                      value={formatDate(reservation.check_in)}
                      subValue={`${getNights(
                        reservation.check_in,
                        reservation.check_out
                      )} night(s) stay`}
                    />
                    <InfoBox
                      label="Check-Out"
                      value={formatDate(reservation.check_out)}
                      subValue="Scheduled departure"
                    />
                    <InfoBox
                      label="Guests"
                      value={String(reservation.guests || 0)}
                      subValue="Occupants"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Email" value={reservation.email} />
                    <DetailRow label="Phone" value={reservation.phone || "N/A"} />
                    <DetailRow label="Reservation ID" value={`#${reservation.id}`} />
                    <DetailRow
                      label="Created At"
                      value={formatDateTime(reservation.created_at)}
                    />
                  </div>
                </div>

                {/* Right */}
                <div className="flex min-w-[220px] flex-col gap-3">
                  <button
                    onClick={() => handleCheckOut(reservation)}
                    disabled={processingId === reservation.id}
                    className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processingId === reservation.id
                      ? "Processing..."
                      : "🔓 Check-Out Guest"}
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setSelectedReservation(reservation)}
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onCheckOut={() => handleCheckOut(selectedReservation)}
          processing={processingId === selectedReservation.id}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          getNights={getNights}
          statusBadge={statusBadge}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "rose";
}) {
  const styles =
    color === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-2xl px-5 py-3 text-center ${styles}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
      {subValue && <p className="mt-1 text-xs text-slate-500">{subValue}</p>}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ReservationDetailsModal({
  reservation,
  onClose,
  onCheckOut,
  processing,
  formatDate,
  formatDateTime,
  getNights,
  statusBadge,
}: {
  reservation: Reservation;
  onClose: () => void;
  onCheckOut: () => void;
  processing: boolean;
  formatDate: (value?: string) => string;
  formatDateTime: (value?: string) => string;
  getNights: (checkIn: string, checkOut: string) => number;
  statusBadge: (status: string) => React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Check-Out Details
            </h2>
            <p className="text-sm text-slate-500">
              Full guest and stay information
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900">
              {reservation.customer_name}
            </h3>
            {statusBadge(reservation.status)}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              #{reservation.id}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Guest Name" value={reservation.customer_name} />
            <DetailRow label="Email" value={reservation.email} />
            <DetailRow label="Phone" value={reservation.phone || "N/A"} />
            <DetailRow label="Guests" value={String(reservation.guests || 0)} />
            <DetailRow
              label="Room Number"
              value={`Room ${reservation.room_number || "N/A"}`}
            />
            <DetailRow
              label="Room Category"
              value={reservation.room_category || "N/A"}
            />
            <DetailRow label="Check-In Date" value={formatDate(reservation.check_in)} />
            <DetailRow
              label="Check-Out Date"
              value={formatDate(reservation.check_out)}
            />
            <DetailRow
              label="Total Nights"
              value={`${getNights(reservation.check_in, reservation.check_out)} night(s)`}
            />
            <DetailRow
              label="Created At"
              value={formatDateTime(reservation.created_at)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={onCheckOut}
            disabled={processing}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? "Processing..." : "🔓 Confirm Check-Out"}
          </button>
        </div>
      </div>
    </div>
  );
}