"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { useRouter } from "next/navigation";

interface DashboardStats {
  total_rooms: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  occupancy_rate: number;
  estimated_revenue: number;
  recent_reservations: {
    id: number;
    customer_name: string;
    room_name: string;
    status: string;
    check_in: string;
  }[];
  recent_orders: {
    id: number;
    customer_name: string;
    room_name: string;
    status: string;
  }[];
}

interface ApiResponse {
  success: boolean;
  data: DashboardStats;
}

const STATUS_COLORS: Record<string, string> = {
  Pending:   "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse>("/api/staff/dashboard/");
      return res.data.data;
    },
  });

  const statCards = [
    { label: "Total Rooms",      value: data?.total_rooms ?? 0,        accent: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", href: "/rooms" },
    { label: "Total Bookings",   value: data?.total_bookings ?? 0,     accent: "bg-sky-500",     light: "bg-sky-50",     text: "text-sky-700",     href: "/reservations" },
    { label: "Pending",          value: data?.pending_bookings ?? 0,   accent: "bg-amber-500",   light: "bg-amber-50",   text: "text-amber-700",   href: "/reservations" },
    { label: "Confirmed",        value: data?.confirmed_bookings ?? 0, accent: "bg-teal-500",    light: "bg-teal-50",    text: "text-teal-700",    href: "/reservations" },
    { label: "Cancelled",        value: data?.cancelled_bookings ?? 0, accent: "bg-red-400",     light: "bg-red-50",     text: "text-red-600",     href: "/reservations" },
    { label: "Occupancy Rate",   value: `${data?.occupancy_rate ?? 0}%`, accent: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700",  href: "/rooms" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome to Mahameruwa 🏨</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of rooms, bookings, orders, and reservations.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Revenue Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Estimated Revenue</p>
        <p className="text-3xl font-bold mt-1">
          LKR {(data?.estimated_revenue ?? 0).toLocaleString()}
        </p>
        <p className="text-xs opacity-70 mt-1">From confirmed reservations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border bg-white p-4 h-24" />
          ))
        ) : (
          statCards.map(({ label, value, accent, light, text, href }) => (
            <div
              key={label}
              onClick={() => router.push(href)}
              className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`h-8 w-8 rounded-xl ${light} flex items-center justify-center mb-3`}>
                <div className={`h-3 w-3 rounded-full ${accent}`} />
              </div>
              <p className={`text-xl font-bold text-slate-900`}>{value}</p>
              <p className={`text-xs font-medium ${text} mt-0.5`}>{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Recent Tables */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Reservations */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Reservations</h2>
            <button onClick={() => router.push("/reservations")} className="text-xs text-emerald-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {isLoading ? (
              [...Array(4)].map((_, i) => <RowSkeleton key={i} />)
            ) : !data?.recent_reservations?.length ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">No reservations yet.</p>
            ) : (
              data.recent_reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.customer_name}</p>
                    <p className="text-xs text-slate-400">{r.room_name} · Check-in {r.check_in}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[r.status] ?? "bg-slate-50 text-slate-600"}`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <button onClick={() => router.push("/orders")} className="text-xs text-emerald-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {isLoading ? (
              [...Array(4)].map((_, i) => <RowSkeleton key={i} />)
            ) : !data?.recent_orders?.length ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">No orders yet.</p>
            ) : (
              data.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{o.customer_name}</p>
                    <p className="text-xs text-slate-400">{o.room_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] ?? "bg-slate-50 text-slate-600"}`}>
                    {o.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between px-4 py-3">
      <div className="space-y-1.5">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-2.5 w-36 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-16 rounded-full bg-slate-100" />
    </div>
  );
}