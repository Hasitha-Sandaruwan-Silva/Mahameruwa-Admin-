"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { apiClient } from "../../utils/api";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count.toLocaleString()}{suffix}</>;
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <p className="text-3xl font-bold text-white tabular-nums">
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </p>
      <p className="text-sm text-slate-400">
        {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
};

const PulsingDot = ({ color = "teal" }: { color?: string }) => (
  <span className="relative flex h-3 w-3">
    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-${color}-400 opacity-75`} />
    <span className={`relative inline-flex h-3 w-3 rounded-full bg-${color}-500`} />
  </span>
);

// ═══════════════════════════════════════════════════════════════════════════
// MINI SPARKLINE CHART
// ═══════════════════════════════════════════════════════════════════════════

const Sparkline = ({ data, color = "#14b8a6" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 30;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${width} ${height} L 0 ${height} Z`} fill={`url(#sparkGrad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1]?.x} cy={points[points.length - 1]?.y} r="3" fill={color} />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOM GRID VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const RoomGrid = ({ rooms, reservations }: { rooms: any[]; reservations: any[] }) => {
  const getStatus = (roomId: number) => {
    const res = reservations.find((r: any) => r.room === roomId || r.room_id === roomId);
    if (!res) return "available";
    const status = res.status?.toLowerCase();
    if (status === "checked in" || status === "checked-in") return "occupied";
    if (status === "confirmed") return "arriving";
    return "available";
  };

  const statusConfig = {
    available: { color: "bg-emerald-500", label: "Available", ring: "ring-emerald-200" },
    occupied: { color: "bg-rose-500", label: "Occupied", ring: "ring-rose-200" },
    arriving: { color: "bg-amber-500", label: "Arriving", ring: "ring-amber-200" },
  };

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
      {rooms.slice(0, 20).map((room: any) => {
        const status = getStatus(room.customer_room || room.id);
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <div
            key={room.id}
            className={`group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl ${config.color} text-xs font-bold text-white shadow-lg transition-all duration-300 hover:scale-110 hover:ring-4 ${config.ring}`}
          >
            {room.room_number || room.id}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {config.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════════════════

const TodayTimeline = ({ reservations }: { reservations: any[] }) => {
  const today = new Date().toISOString().split("T")[0];
  
  const todayReservations = reservations.filter((r: any) => {
    return r.check_in === today || r.check_out === today;
  }).slice(0, 5);

  return (
    <div className="space-y-3">
      {todayReservations.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-4xl">🌟</span>
          <p className="mt-2 text-sm text-slate-400">No arrivals or departures today</p>
        </div>
      ) : (
        todayReservations.map((res: any, i: number) => {
          const isArrival = res.check_in === today;
          return (
            <div key={res.id} className="flex items-center gap-4">
              <div className="relative flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isArrival ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {isArrival ? "🛬" : "🛫"}
                </div>
                {i < todayReservations.length - 1 && (
                  <div className="absolute top-10 h-8 w-0.5 bg-slate-200" />
                )}
              </div>
              <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{res.customer_name || res.guest_name || `#${res.id}`}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isArrival ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {isArrival ? "ARRIVAL" : "DEPARTURE"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Room {res.room_number || res.room} · {res.guests} guests
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// QUICK SEARCH MODAL
// ═══════════════════════════════════════════════════════════════════════════

const QuickSearchModal = ({ isOpen, onClose, reservations, onSelect }: any) => {
  const [query, setQuery] = useState("");
  
  const filtered = useMemo(() => {
    if (!query.trim()) return reservations.slice(0, 10);
    const q = query.toLowerCase();
    return reservations.filter((r: any) =>
      (r.customer_name || "").toLowerCase().includes(q) ||
      String(r.room).includes(q) ||
      (r.phone || "").includes(q)
    ).slice(0, 10);
  }, [query, reservations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests, rooms, phone numbers..."
            autoFocus
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-lg outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-400">ESC</kbd>
        </div>
        
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {filtered.map((res: any) => (
            <button
              key={res.id}
              onClick={() => { onSelect(res); onClose(); }}
              className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-slate-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 font-bold text-white">
                {res.room}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{res.customer_name || `Reservation #${res.id}`}</p>
                <p className="text-sm text-slate-400">{res.phone || res.email || "No contact"} · {res.status}</p>
              </div>
              <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-slate-400">
          <div className="flex gap-4">
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5">Enter</kbd> Select</span>
          </div>
          <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5">⌘K</kbd> Quick Search</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION PANEL
// ═══════════════════════════════════════════════════════════════════════════

const NotificationPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const notifications = [
    { id: 1, type: "arrival", message: "John Doe arriving in 2 hours", time: "10:30 AM", icon: "🛬" },
    { id: 2, type: "checkout", message: "Room 205 checkout pending", time: "11:00 AM", icon: "🛫" },
    { id: 3, type: "payment", message: "Payment received - Room 301", time: "9:45 AM", icon: "💳" },
    { id: 4, type: "service", message: "Room service request - Room 102", time: "9:30 AM", icon: "🍽️" },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Notifications</h3>
        <button className="text-xs text-teal-600 hover:text-teal-700">Mark all read</button>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded-2xl p-3 transition-all hover:bg-slate-50">
            <span className="text-2xl">{n.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{n.message}</p>
              <p className="text-xs text-slate-400">{n.time}</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-teal-500" />
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200">
        View All Notifications
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function ReceptionistDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Queries ──
  const { data: stats } = useQuery({
    queryKey: ["receptionist-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/dashboard/");
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: activity } = useQuery({
    queryKey: ["today-activity"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/today-activity/");
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/reservations/");
      return res.data.data || [];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/rooms/");
      return res.data.data || [];
    },
  });

  const { data: recentBookings = [] } = useQuery({
    queryKey: ["recent-bookings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/bookings/");
      return res.data.data?.slice(0, 6) || [];
    },
  });

  // ── Check-in Mutation ──
  const checkInMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/api/staff/reservations/${id}/check-in/`),
    onSuccess: () => {
      toast.success("Guest checked in successfully!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["today-activity"] });
      setSelectedReservation(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Check-in failed"),
  });

  // ── Stats Cards Data ──
  const statCards = [
    {
      label: "Total Rooms",
      value: stats?.total_rooms ?? 0,
      icon: "🏨",
      gradient: "from-slate-700 to-slate-900",
      sparkData: [12, 15, 14, 16, 15, 17, 16],
      change: "+0%",
      changeType: "neutral",
    },
    {
      label: "Occupied",
      value: activity?.occupied_rooms ?? 0,
      icon: "🛏️",
      gradient: "from-rose-500 to-pink-600",
      sparkData: [8, 10, 9, 12, 11, 13, 12],
      change: "+8%",
      changeType: "up",
    },
    {
      label: "Available",
      value: activity?.available_rooms ?? 0,
      icon: "✅",
      gradient: "from-emerald-500 to-teal-600",
      sparkData: [6, 5, 7, 4, 6, 5, 4],
      change: "-12%",
      changeType: "down",
    },
    {
      label: "Arrivals Today",
      value: activity?.arrivals_today ?? 0,
      icon: "🛬",
      gradient: "from-blue-500 to-indigo-600",
      sparkData: [3, 5, 2, 6, 4, 7, 5],
      change: "+25%",
      changeType: "up",
    },
    {
      label: "Departures",
      value: activity?.departures_today ?? 0,
      icon: "🛫",
      gradient: "from-amber-500 to-orange-600",
      sparkData: [4, 3, 5, 4, 6, 5, 4],
      change: "+10%",
      changeType: "up",
    },
    {
      label: "Pending",
      value: activity?.pending_today ?? 0,
      icon: "⏳",
      gradient: "from-violet-500 to-purple-600",
      sparkData: [2, 3, 1, 4, 2, 3, 2],
      change: "-5%",
      changeType: "down",
    },
  ];

  // ── Quick Actions ──
  const quickActions = [
    {
      label: "Quick Search",
      desc: "Find guests instantly",
      icon: "🔍",
      gradient: "from-slate-700 to-slate-900",
      action: () => setSearchOpen(true),
      kbd: "⌘K",
    },
    {
      label: "New Reservation",
      desc: "Walk-in guest",
      icon: "📝",
      gradient: "from-teal-500 to-cyan-600",
      href: "/receptionist/reservations",
    },
    {
      label: "POS Terminal",
      desc: "Food & drinks",
      icon: "🍽️",
      gradient: "from-emerald-500 to-teal-600",
      href: "/receptionist/pos",
    },
    {
      label: "Billing",
      desc: "Generate bills",
      icon: "🧾",
      gradient: "from-blue-500 to-indigo-600",
      href: "/receptionist/bill",
    },
  ];

  return (
    <div className="relative min-h-screen space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl lg:p-8">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl" />
        
        <div className="relative">
          {/* Top Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <PulsingDot />
                <span className="text-sm font-medium text-teal-300">Front Desk Active</span>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400 md:flex">
                <span>Press</span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white">⌘K</kbd>
                <span>to search</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold">4</span>
                </button>
                <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
              
              {/* Live Clock */}
              <LiveClock />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white lg:text-4xl">
                  Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},
                  <span className="mt-1 block bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Welcome Back! 🏨
                  </span>
                </h1>
                <p className="mt-2 max-w-lg text-slate-400">
                  Manage check-ins, room availability, and guest services from your command center.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="flex flex-wrap gap-4">
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Occupancy Rate</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-white">{stats?.occupancy_rate ?? 0}%</p>
                    <span className="text-xs text-emerald-400">↑ 5%</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Today's Revenue</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-teal-400">
                      LKR <AnimatedCounter value={stats?.estimated_revenue ?? 0} />
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Active Guests</p>
                  <p className="text-2xl font-bold text-white">{activity?.occupied_rooms ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Occupancy Ring */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="rotate-[-90deg]" width={160} height={160}>
                  <circle strokeWidth={12} stroke="rgba(255,255,255,0.1)" fill="transparent" r={70} cx={80} cy={80} />
                  <circle
                    className="transition-all duration-1000"
                    strokeWidth={12}
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (stats?.occupancy_rate ?? 0)) / 100}
                    strokeLinecap="round"
                    stroke="url(#occupancyGradient)"
                    fill="transparent"
                    r={70} cx={80} cy={80}
                  />
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{stats?.occupancy_rate ?? 0}%</span>
                  <span className="text-xs uppercase tracking-wider text-slate-400">Occupancy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK ACTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.action || (() => router.push(action.href!))}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${action.gradient} p-5 text-left shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-3xl transition-transform duration-300 group-hover:scale-125">{action.icon}</span>
                {action.kbd && (
                  <kbd className="rounded-lg bg-white/20 px-2 py-0.5 text-xs text-white/80">{action.kbd}</kbd>
                )}
              </div>
              <h3 className="text-base font-bold text-white">{action.label}</h3>
              <p className="mt-0.5 text-xs text-white/70">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STAT CARDS WITH SPARKLINES
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-5 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-xl shadow-lg transition-transform duration-500 group-hover:scale-110`}>
                {card.icon}
              </div>
              <Sparkline data={card.sparkData} color={card.changeType === "up" ? "#10b981" : card.changeType === "down" ? "#ef4444" : "#6b7280"} />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              <AnimatedCounter value={card.value} />
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span className={`text-xs font-semibold ${
                card.changeType === "up" ? "text-emerald-500" :
                card.changeType === "down" ? "text-rose-500" :
                "text-slate-400"
              }`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Room Grid */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-lg shadow-lg">🏨</div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Room Status</h2>
                  <p className="text-xs text-slate-400">Real-time room availability</p>
                </div>
              </div>
              <button 
                onClick={() => router.push("/receptionist/rooms")}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
              >
                View All →
              </button>
            </div>
            
            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-slate-500">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-slate-500">Arriving</span>
              </div>
            </div>
            
            <RoomGrid rooms={rooms} reservations={reservations} />
          </div>

          {/* Recent Bookings */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg shadow-lg">📅</div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
                  <p className="text-xs text-slate-400">Latest online bookings</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/receptionist/bookings")}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-2">
              {recentBookings.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="text-4xl">📭</span>
                  <p className="mt-2 text-sm text-slate-400">No recent bookings</p>
                </div>
              ) : (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="group flex items-center gap-4 rounded-2xl p-3 transition-all hover:bg-slate-50">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                      booking.status === "Confirmed" ? "bg-emerald-100" :
                      booking.status === "Pending" ? "bg-amber-100" :
                      "bg-rose-100"
                    }`}>
                      {booking.status === "Confirmed" ? "✅" : booking.status === "Pending" ? "⏳" : "❌"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{booking.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {booking.room_category} · {booking.check_in} · {booking.guests} guests
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      booking.status === "Confirmed" ? "bg-emerald-100 text-emerald-700" :
                      booking.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Today's Timeline */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg shadow-lg">📋</div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Today&apos;s Timeline</h2>
                <p className="text-xs text-slate-400">Arrivals & departures</p>
              </div>
            </div>
            <TodayTimeline reservations={reservations} />
          </div>

          {/* Quick Check-in Card */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">🛬</span>
              <div>
                <h3 className="text-lg font-bold">Quick Check-In</h3>
                <p className="text-sm text-white/70">Search & check-in guests</p>
              </div>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/20 px-4 py-3 text-left transition-all hover:bg-white/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 text-sm">Search guest name or room...</span>
              <kbd className="rounded bg-white/20 px-2 py-0.5 text-xs">⌘K</kbd>
            </button>
          </div>

          {/* Hotel Tips */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <h3 className="font-bold text-slate-800">Quick Tips</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span>⌨️</span>
                <p>Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">⌘K</kbd> for quick search</p>
              </div>
              <div className="flex items-start gap-2">
                <span>🖱️</span>
                <p>Click room tiles to view details</p>
              </div>
              <div className="flex items-start gap-2">
                <span>📱</span>
                <p>POS available for food orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEARCH MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <QuickSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        reservations={reservations}
        onSelect={(res: any) => {
          setSelectedReservation(res);
          router.push(`/receptionist/reservations?id=${res.id}`);
        }}
      />
    </div>
  );
}