"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../utils/api";
import { useRouter } from "next/navigation";

// Types
interface DashboardStats {
  total_rooms: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  occupancy_rate: number;
  estimated_revenue: number;
}

interface ApiResponse {
  success: boolean;
  data: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  color: string;
  light: string;
  text: string;
  href: string;
}

interface QuickAction {
  label: string;
  href: string;
  color: string;
}

export default function ReceptionistOverviewPage() {
  const router = useRouter();

  // Fetch dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ["receptionist-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse>("/api/staff/dashboard/");
      return res.data.data;
    },
  });

  // Stat cards configuration
  const cards: StatCard[] = [
    {
      label: "Total Rooms",
      value: data?.total_rooms ?? 0,
      color: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-700",
      href: "/receptionist/rooms",
    },
    {
      label: "Total Bookings",
      value: data?.total_bookings ?? 0,
      color: "bg-emerald-500",
      light: "bg-emerald-50",
      text: "text-emerald-700",
      href: "/receptionist/bookings",
    },
    {
      label: "Pending",
      value: data?.pending_bookings ?? 0,
      color: "bg-amber-500",
      light: "bg-amber-50",
      text: "text-amber-700",
      href: "/receptionist/reservations",
    },
    {
      label: "Confirmed",
      value: data?.confirmed_bookings ?? 0,
      color: "bg-teal-500",
      light: "bg-teal-50",
      text: "text-teal-700",
      href: "/receptionist/reservations",
    },
    {
      label: "Cancelled",
      value: data?.cancelled_bookings ?? 0,
      color: "bg-red-400",
      light: "bg-red-50",
      text: "text-red-600",
      href: "/receptionist/reservations",
    },
    {
      label: "Occupancy Rate",
      value: `${data?.occupancy_rate ?? 0}%`,
      color: "bg-violet-500",
      light: "bg-violet-50",
      text: "text-violet-700",
      href: "/receptionist/rooms",
    },
  ];

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      label: "New Reservation",
      href: "/receptionist/reservations",
      color: "bg-blue-600",
    },
    {
      label: "Check Availability",
      href: "/receptionist/rooms",
      color: "bg-emerald-600",
    },
    {
      label: "View Bookings",
      href: "/receptionist/bookings",
      color: "bg-amber-600",
    },
    {
      label: "Generate Bill",
      href: "/receptionist/bill",
      color: "bg-violet-600",
    },
  ];

  // Get formatted date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format revenue
  const formattedRevenue = (data?.estimated_revenue ?? 0).toLocaleString();

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Receptionist overview — {formattedDate}
          </p>
        </div>
        <button
          onClick={() => router.push("/receptionist/reservations")}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          + New Reservation
        </button>
      </div>

      {/* Revenue Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 p-5 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">
          Estimated Revenue
        </p>
        <p className="text-3xl font-bold mt-1">
          LKR {formattedRevenue}
        </p>
        <p className="text-xs opacity-70 mt-1">
          From confirmed reservations
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border bg-white p-4 h-24"
            />
          ))
        ) : (
          // Stat cards
          cards.map((card) => (
            <div
              key={card.label}
              onClick={() => router.push(card.href)}
              className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div
                className={`h-8 w-8 rounded-xl ${card.light} flex items-center justify-center mb-3`}
              >
                <div className={`h-3 w-3 rounded-full ${card.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {card.value}
              </p>
              <p className={`text-xs font-medium ${card.text} mt-0.5`}>
                {card.label}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`${action.color} text-white rounded-2xl p-4 text-sm font-medium hover:opacity-90 transition-opacity text-left shadow-sm`}
          >
            {action.label}
          </button>
        ))}
      </div>

    </div>
  );
}