"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";

interface DashboardStats {
  total_rooms: number;
  total_bookings: number;
  pending_bookings: number;
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

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: async () => {
      const res = await apiClient.get<DashboardStats>("/api/staff/dashboard/");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome to Mahameruwa
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of rooms, bookings, orders, and reservations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Rooms"
              value={data?.total_rooms ?? 0}
              accent="bg-emerald-500"
            />
            <StatCard
              label="Total Bookings"
              value={data?.total_bookings ?? 0}
              accent="bg-sky-500"
            />
            <StatCard
              label="Pending Bookings"
              value={data?.pending_bookings ?? 0}
              accent="bg-amber-500"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Reservations
            </h2>
          </div>
          <div className="space-y-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <RowSkeleton key={index} />
              ))}
            {!isLoading && data?.recent_reservations?.length === 0 && (
              <p className="text-xs text-slate-500">
                No reservations recorded yet.
              </p>
            )}
            {data?.recent_reservations?.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {r.customer_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {r.room_name} · Check-in {r.check_in}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Orders
            </h2>
          </div>
          <div className="space-y-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <RowSkeleton key={index} />
              ))}
            {!isLoading && data?.recent_orders?.length === 0 && (
              <p className="text-xs text-slate-500">
                No orders recorded yet.
              </p>
            )}
            {data?.recent_orders?.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {o.customer_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {o.room_name} · {o.status}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-full ${accent} opacity-80`} />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-white p-4 shadow-sm">
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="mt-3 h-6 w-12 rounded bg-slate-100" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
      <div className="space-y-1">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-2 w-32 rounded bg-slate-100" />
      </div>
      <div className="h-4 w-12 rounded-full bg-slate-100" />
    </div>
  );
}

