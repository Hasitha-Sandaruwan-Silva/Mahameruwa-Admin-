"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "../../utils/api";
import { Footer } from "../components/layout/Footer";

// Types
interface AccountantStats {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  pending_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  monthly_target: number;
  monthly_achieved: number;
}

interface ApiResponse {
  success: boolean;
  data: AccountantStats;
}

interface StatCard {
  label: string;
  value: string | number;
  prefix?: string;
  icon: string;
  gradient: string;
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
    <div className="absolute -left-40 -top-40 h-80 w-80 animate-blob rounded-full bg-gradient-to-br from-emerald-300/30 to-teal-300/30 mix-blend-multiply blur-3xl" />
    <div className="animation-delay-2000 absolute -right-40 top-1/4 h-96 w-96 animate-blob rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-300/30 mix-blend-multiply blur-3xl" />
    <div className="animation-delay-4000 absolute -bottom-40 left-1/3 h-80 w-80 animate-blob rounded-full bg-gradient-to-br from-violet-300/30 to-purple-300/30 mix-blend-multiply blur-3xl" />
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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
        <span className="text-2xl">📅</span>
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

// Mini Chart Component
const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex h-12 items-end gap-1">
      {data.map((value, index) => (
        <div
          key={index}
          className={`w-2 rounded-t-sm ${color} transition-all duration-500`}
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: "4px",
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, label }: { progress: number; size?: number; strokeWidth?: number; label: string }) => {
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
          className="text-emerald-400 transition-all duration-1000 ease-out"
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
        <span className="text-[10px] text-white/60 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};

// Revenue Card (Large)
const RevenueCard = ({ title, value, trend, trendUp, icon, gradient, chartData }: {
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  icon: string;
  gradient: string;
  chartData: number[];
}) => (
  <div className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`}>
    {/* Shine Effect */}
    <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
    
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70">{title}</p>
        <p className="mt-2 text-3xl font-bold text-white">
          LKR <AnimatedCounter value={value} />
        </p>
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          trendUp ? "bg-white/20 text-white" : "bg-white/20 text-white"
        }`}>
          <span>{trendUp ? "↑" : "↓"}</span>
          {trend} vs last month
        </div>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
    
    <div className="mt-6">
      <MiniChart data={chartData} color="bg-white/40" />
    </div>
  </div>
);

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
    <p className="text-2xl font-bold text-slate-800">
      {card.prefix && <span className="text-lg text-slate-500">{card.prefix}</span>}
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
    <div className="absolute bottom-4 right-4 flex h-8 w-8 translate-x-2 items-center justify-center rounded-full bg-slate-100 text-slate-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
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
    
    <div className="relative">
      <span className="mb-4 inline-block text-4xl transition-transform duration-300 group-hover:scale-125">{action.icon}</span>
      <h3 className="text-lg font-bold text-white">{action.label}</h3>
      <p className="mt-1 text-sm text-white/70">{action.description}</p>
      
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
        <span>Open</span>
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  </button>
);

// Transaction Item
const TransactionItem = ({ icon, title, amount, time, type }: { 
  icon: string; 
  title: string; 
  amount: number;
  time: string; 
  type: "income" | "expense" | "pending";
}) => (
  <div className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-slate-50">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-transform duration-300 group-hover:scale-110 ${
      type === "income" ? "bg-emerald-100" : type === "expense" ? "bg-rose-100" : "bg-amber-100"
    }`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
    <div className="text-right">
      <p className={`font-bold ${
        type === "income" ? "text-emerald-600" : type === "expense" ? "text-rose-600" : "text-amber-600"
      }`}>
        {type === "income" ? "+" : type === "expense" ? "-" : ""}LKR {amount.toLocaleString()}
      </p>
      <span className={`text-xs font-medium ${
        type === "income" ? "text-emerald-500" : type === "expense" ? "text-rose-500" : "text-amber-500"
      }`}>
        {type === "income" ? "Received" : type === "expense" ? "Paid" : "Pending"}
      </span>
    </div>
  </div>
);

// Invoice Status Badge
const InvoiceStatusBadge = ({ status, count }: { status: string; count: number }) => {
  const styles = {
    paid: "from-emerald-500 to-teal-500",
    pending: "from-amber-500 to-orange-500",
    overdue: "from-rose-500 to-pink-500",
  };

  return (
    <div className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${styles[status as keyof typeof styles]} p-4 text-white`}>
      <div>
        <p className="text-sm font-medium text-white/80 capitalize">{status}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
        {status === "paid" ? "✅" : status === "pending" ? "⏳" : "⚠️"}
      </div>
    </div>
  );
};

export default function AccountantDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["accountant-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse>("/api/staff/accountant/dashboard/");
      return res.data.data;
    },
  });

  // Mock data for demonstration
  const mockData: AccountantStats = {
    total_revenue: data?.total_revenue ?? 2450000,
    total_expenses: data?.total_expenses ?? 890000,
    net_profit: data?.net_profit ?? 1560000,
    pending_invoices: data?.pending_invoices ?? 23,
    paid_invoices: data?.paid_invoices ?? 156,
    overdue_invoices: data?.overdue_invoices ?? 8,
    monthly_target: data?.monthly_target ?? 3000000,
    monthly_achieved: data?.monthly_achieved ?? 2450000,
  };

  const targetProgress = Math.round((mockData.monthly_achieved / mockData.monthly_target) * 100);

  const cards: StatCard[] = [
    {
      label: "Total Revenue",
      value: mockData.total_revenue,
      prefix: "LKR ",
      icon: "💰",
      gradient: "from-emerald-500 to-teal-500",
      href: "/accountant/revenue",
      trend: "+18%",
      trendUp: true,
    },
    {
      label: "Total Expenses",
      value: mockData.total_expenses,
      prefix: "LKR ",
      icon: "📉",
      gradient: "from-rose-500 to-pink-500",
      href: "/accountant/expenses",
      trend: "+5%",
      trendUp: false,
    },
    {
      label: "Net Profit",
      value: mockData.net_profit,
      prefix: "LKR ",
      icon: "📈",
      gradient: "from-blue-500 to-indigo-500",
      href: "/accountant/profit",
      trend: "+24%",
      trendUp: true,
    },
    {
      label: "Pending Invoices",
      value: mockData.pending_invoices,
      icon: "📋",
      gradient: "from-amber-500 to-orange-500",
      href: "/accountant/invoices",
    },
    {
      label: "Paid Invoices",
      value: mockData.paid_invoices,
      icon: "✅",
      gradient: "from-emerald-500 to-green-500",
      href: "/accountant/invoices",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Overdue",
      value: mockData.overdue_invoices,
      icon: "⚠️",
      gradient: "from-red-500 to-rose-500",
      href: "/accountant/invoices",
      trend: "-3",
      trendUp: true,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: "Create Invoice",
      description: "Generate new invoice",
      href: "/accountant/invoices/new",
      icon: "📝",
      gradient: "from-emerald-500 via-emerald-600 to-teal-600",
    },
    {
      label: "Record Expense",
      description: "Add new expense",
      href: "/accountant/expenses/new",
      icon: "💸",
      gradient: "from-rose-500 via-rose-600 to-pink-600",
    },
    {
      label: "Financial Report",
      description: "View analytics",
      href: "/accountant/reports",
      icon: "📊",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
    },
    {
      label: "Payroll",
      description: "Manage salaries",
      href: "/accountant/payroll",
      icon: "👥",
      gradient: "from-violet-500 via-violet-600 to-purple-600",
    },
  ];

  const recentTransactions = [
    { icon: "🏨", title: "Room Booking - Suite 101", amount: 45000, time: "10 mins ago", type: "income" as const },
    { icon: "🍽️", title: "Restaurant Supply", amount: 12500, time: "1 hour ago", type: "expense" as const },
    { icon: "💳", title: "Pending Payment - Corp Client", amount: 85000, time: "2 hours ago", type: "pending" as const },
    { icon: "⚡", title: "Electricity Bill", amount: 28000, time: "Yesterday", type: "expense" as const },
    { icon: "🎉", title: "Event Booking", amount: 125000, time: "Yesterday", type: "income" as const },
  ];

  const chartData = [45, 52, 38, 65, 48, 72, 55, 80, 62, 95, 78, 88];

  return (
    <div className="relative min-h-screen">
      <FloatingOrbs />
      
      <div className="relative space-y-8 p-4 lg:p-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl lg:p-10">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-500/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-500/40 blur-3xl" />
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
                <span className="text-sm font-medium text-emerald-300">Financial System Active</span>
              </div>

              <h1 className="text-4xl font-bold text-white lg:text-5xl">
                Welcome Back,
                <span className="mt-1 block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Accountant! 💼
                </span>
              </h1>

              <p className="max-w-md text-slate-400">
                Your financial dashboard is ready. Track revenue, manage invoices, and monitor all transactions.
              </p>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Monthly Target</p>
                  <p className="text-xl font-bold text-white">
                    LKR <AnimatedCounter value={mockData.monthly_target} />
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">Achieved</p>
                  <p className="text-xl font-bold text-emerald-400">
                    LKR <AnimatedCounter value={mockData.monthly_achieved} />
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content - Clock & Progress */}
            <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
              <ProgressRing progress={targetProgress} label="Target" />
              <LiveClock />
            </div>
          </div>

          {/* Create Invoice Button */}
          <button
            onClick={() => router.push("/accountant/invoices/new")}
            className="group absolute bottom-6 right-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            <span className="text-xl transition-transform duration-300 group-hover:rotate-90">+</span>
            <span>New Invoice</span>
          </button>
        </div>

        {/* Revenue Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RevenueCard
            title="Total Revenue"
            value={mockData.total_revenue}
            trend="+18%"
            trendUp={true}
            icon="💰"
            gradient="from-emerald-600 to-teal-600"
            chartData={chartData}
          />
          <RevenueCard
            title="Total Expenses"
            value={mockData.total_expenses}
            trend="+5%"
            trendUp={false}
            icon="📉"
            gradient="from-rose-600 to-pink-600"
            chartData={[35, 42, 28, 55, 38, 62, 45, 70, 52, 85, 68, 78]}
          />
          <RevenueCard
            title="Net Profit"
            value={mockData.net_profit}
            trend="+24%"
            trendUp={true}
            icon="📈"
            gradient="from-blue-600 to-indigo-600"
            chartData={[25, 32, 18, 45, 28, 52, 35, 60, 42, 75, 58, 68]}
          />
        </div>

        {/* Invoice Status */}
        <div className="grid gap-4 sm:grid-cols-3">
          <InvoiceStatusBadge status="paid" count={mockData.paid_invoices} />
          <InvoiceStatusBadge status="pending" count={mockData.pending_invoices} />
          <InvoiceStatusBadge status="overdue" count={mockData.overdue_invoices} />
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg shadow-lg">
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

        {/* Bottom Section - Transactions & Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg shadow-lg">
                  💳
                </div>
                <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </button>
            </div>
            
            <div className="space-y-2">
              {recentTransactions.map((transaction, index) => (
                <TransactionItem key={index} {...transaction} />
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-lg shadow-lg">
                  📊
                </div>
                <h2 className="text-lg font-bold text-slate-800">Monthly Summary</h2>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Revenue vs Expenses */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Revenue vs Target</span>
                  <span className="font-bold text-slate-800">{targetProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Salaries", amount: 450000, color: "from-blue-500 to-indigo-500" },
                  { label: "Utilities", amount: 85000, color: "from-amber-500 to-orange-500" },
                  { label: "Supplies", amount: 125000, color: "from-emerald-500 to-teal-500" },
                  { label: "Other", amount: 230000, color: "from-violet-500 to-purple-500" },
                ].map((item, index) => (
                  <div key={index} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      LKR {item.amount.toLocaleString()}
                    </p>
                    <div className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
                  </div>
                ))}
              </div>

              {/* Bottom Stats */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Profit Margin</p>
                  <p className="text-lg font-bold text-emerald-400">63.7%</p>
                </div>
                <div className="text-center border-x border-slate-700">
                  <p className="text-xs text-slate-400">Cash Flow</p>
                  <p className="text-lg font-bold text-blue-400">+1.2M</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">ROI</p>
                  <p className="text-lg font-bold text-amber-400">24.5%</p>
                </div>
              </div>
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