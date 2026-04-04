"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "../../utils/api";
import { Footer } from "../components/layout/Footer";

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
  icon: string;
  gradient: string;
  lightBg: string;
  href: string;
  trend?: string;
  trendUp?: boolean;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: string;
  gradient: string;
}

// Floating Background Animation
const FloatingOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute -left-40 -top-40 h-80 w-80 animate-blob rounded-full bg-gradient-to-br from-rose-300/30 to-orange-300/30 mix-blend-multiply blur-3xl" />
    <div className="animation-delay-2000 absolute -right-40 top-1/4 h-96 w-96 animate-blob rounded-full bg-gradient-to-br from-violet-300/30 to-purple-300/30 mix-blend-multiply blur-3xl" />
    <div className="animation-delay-4000 absolute -bottom-40 left-1/3 h-80 w-80 animate-blob rounded-full bg-gradient-to-br from-amber-300/30 to-yellow-300/30 mix-blend-multiply blur-3xl" />
  </div>
);

// Live Clock Component
const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-2xl font-bold text-white">
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-white/60">
          {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>
      <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
        <span className="text-2xl">🕐</span>
      </div>
    </div>
  );
};

// Animated Counter
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
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
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className="text-white/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-white transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{progress}%</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider">Served</span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCardComponent = ({ card, index, onClick }: { card: StatCard; index: number; onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{ animationDelay: `${index * 100}ms` }}
    className="group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-3xl border border-white/20 bg-white/70 p-5 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
  >
    {/* Hover Gradient Overlay */}
    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
    
    {/* Icon */}
    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
      {card.icon}
    </div>

    {/* Value */}
    <p className="text-3xl font-bold text-slate-800">
      {typeof card.value === "number" ? <AnimatedCounter value={card.value} /> : card.value}
    </p>

    {/* Label */}
    <p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>

    {/* Trend Badge */}
    {card.trend && (
      <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        card.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}>
        <span>{card.trendUp ? "↑" : "↓"}</span>
        {card.trend}
      </div>
    )}

    {/* Arrow Icon */}
    <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
);

// Quick Action Card
const QuickActionCard = ({ action, index, onClick }: { action: QuickAction; index: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{ animationDelay: `${index * 100 + 400}ms` }}
    className={`group relative animate-fade-in-up overflow-hidden rounded-3xl bg-gradient-to-br ${action.gradient} p-6 text-left shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`}
  >
    {/* Shine Effect */}
    <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
    
    {/* Content */}
    <div className="relative">
      <span className="mb-4 inline-block text-4xl transition-transform duration-300 group-hover:scale-125">{action.icon}</span>
      <h3 className="text-lg font-bold text-white">{action.label}</h3>
      <p className="mt-1 text-sm text-white/70">{action.description}</p>
      
      {/* Arrow */}
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
        <span>Open</span>
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  </button>
);

// Recent Activity Item
const ActivityItem = ({ icon, title, time, status }: { icon: string; title: string; time: string; status: "completed" | "pending" | "cancelled" }) => (
  <div className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-slate-50">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="truncate font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
      status === "completed" ? "bg-emerald-100 text-emerald-700" :
      status === "pending" ? "bg-amber-100 text-amber-700" :
      "bg-rose-100 text-rose-700"
    }`}>
      {status}
    </span>
  </div>
);

export default function BarmanDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["barman-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse>("/api/staff/dashboard/");
      return res.data.data;
    },
  });

  const cards: StatCard[] = [
    {
      label: "Total Orders",
      value: data?.total_bookings ?? 0,
      icon: "📋",
      gradient: "from-blue-500 to-cyan-500",
      lightBg: "bg-blue-50",
      href: "/barman/orders",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Pending Orders",
      value: data?.pending_bookings ?? 0,
      icon: "⏳",
      gradient: "from-amber-500 to-orange-500",
      lightBg: "bg-amber-50",
      href: "/barman/orders",
    },
    {
      label: "Served",
      value: data?.confirmed_bookings ?? 0,
      icon: "✅",
      gradient: "from-emerald-500 to-teal-500",
      lightBg: "bg-emerald-50",
      href: "/barman/orders",
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "Stock Alerts",
      value: 0,
      icon: "🚨",
      gradient: "from-rose-500 to-pink-500",
      lightBg: "bg-rose-50",
      href: "/barman/stock",
    },
    {
      label: "Menu Items",
      value: 12,
      icon: "🍹",
      gradient: "from-violet-500 to-purple-500",
      lightBg: "bg-violet-50",
      href: "/barman/menu",
    },
    {
      label: "Daily Sales",
      value: 5,
      icon: "💰",
      gradient: "from-slate-600 to-slate-800",
      lightBg: "bg-slate-50",
      href: "/barman/sales",
      trend: "-3%",
      trendUp: false,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: "New Order",
      description: "Create a drink order",
      href: "/barman/orders/new",
      icon: "🍸",
      gradient: "from-rose-500 via-rose-600 to-pink-600",
    },
    {
      label: "Update Menu",
      description: "Edit drink items",
      href: "/barman/menu",
      icon: "📝",
      gradient: "from-violet-500 via-violet-600 to-purple-600",
    },
    {
      label: "Check Stock",
      description: "Inventory status",
      href: "/barman/stock",
      icon: "📦",
      gradient: "from-amber-500 via-amber-600 to-orange-600",
    },
    {
      label: "Sales Report",
      description: "View analytics",
      href: "/barman/sales",
      icon: "📊",
      gradient: "from-slate-700 via-slate-800 to-slate-900",
    },
  ];

  const recentActivity = [
    { icon: "🍹", title: "Mojito - Table 5", time: "2 mins ago", status: "pending" as const },
    { icon: "🍷", title: "Red Wine - VIP Room", time: "15 mins ago", status: "completed" as const },
    { icon: "🍺", title: "Draft Beer x3 - Table 12", time: "32 mins ago", status: "completed" as const },
    { icon: "🥃", title: "Whiskey Sour - Bar", time: "1 hour ago", status: "cancelled" as const },
  ];

  const formattedRevenue = (data?.estimated_revenue ?? 0).toLocaleString();
  const servedPercentage = data?.total_bookings ? Math.round((data.confirmed_bookings / data.total_bookings) * 100) : 0;

  return (
    <div className="relative min-h-screen">
      <FloatingOrbs />
      
      <div className="relative space-y-8 p-4 lg:p-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl lg:p-10">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/40 to-orange-500/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-500/40 blur-3xl" />
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Content */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-emerald-300">Bar Station Online</span>
              </div>

              <h1 className="text-4xl font-bold text-white lg:text-5xl">
                Good Evening,
                <span className="mt-1 block bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Barman! 🍸
                </span>
              </h1>

              <p className="max-w-md text-slate-400">
                Your bar dashboard is ready. Track orders, manage inventory, and keep the drinks flowing.
              </p>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Today&apos;s Revenue</p>
                  <p className="text-xl font-bold text-white">
                    LKR <AnimatedCounter value={parseInt(formattedRevenue.replace(/,/g, ""))} />
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Active Tables</p>
                  <p className="text-xl font-bold text-white">8</p>
                </div>
              </div>
            </div>

            {/* Right Content - Clock & Progress */}
            <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
              <ProgressRing progress={servedPercentage || 75} />
              <LiveClock />
            </div>
          </div>

          {/* New Order Button */}
          <button
            onClick={() => router.push("/barman/orders")}
            className="group absolute bottom-6 right-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/40"
          >
            <span className="text-xl transition-transform duration-300 group-hover:rotate-90">+</span>
            <span>New Order</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl bg-white/50 p-5 backdrop-blur-sm">
                  <div className="mb-4 h-14 w-14 rounded-2xl bg-slate-200" />
                  <div className="h-8 w-16 rounded-lg bg-slate-200" />
                  <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
                </div>
              ))
            : cards.map((card, index) => (
                <StatCardComponent
                  key={card.label}
                  card={card}
                  index={index}
                  onClick={() => router.push(card.href)}
                />
              ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg shadow-lg">
              ⚡
            </div>
            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={action.label}
                action={action}
                index={index}
                onClick={() => router.push(action.href)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Section - Activity & Popular */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg shadow-lg">
                  📜
                </div>
                <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </button>
            </div>
            
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>

          {/* Popular Drinks */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-lg shadow-lg">
                  🔥
                </div>
                <h2 className="text-lg font-bold text-slate-800">Top Sellers Today</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Classic Mojito", sales: 24, icon: "🍹", percentage: 100 },
                { name: "Whiskey Sour", sales: 18, icon: "🥃", percentage: 75 },
                { name: "Red Wine", sales: 15, icon: "🍷", percentage: 62 },
                { name: "Draft Beer", sales: 12, icon: "🍺", percentage: 50 },
              ].map((drink, index) => (
                <div key={index} className="group">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{drink.icon}</span>
                      <span className="font-medium text-slate-700">{drink.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{drink.sales}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                      style={{ width: `${drink.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <Footer />
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 30px) scale(1.05); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}