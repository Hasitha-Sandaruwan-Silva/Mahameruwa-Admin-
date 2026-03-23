"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../../utils/api";

interface DashboardStats {
  total_rooms: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  occupancy_rate: number;
  estimated_revenue: number;
}

interface Reservation {
  id: number;
  customer_name: string;
  check_in: string;
  check_out: string;
  status: string;
  room: number;
}

interface Order {
  id: number;
  customer_name: string;
  total_price: number;
  status: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EXPENSES = [
  { category: "Staff Salaries", amount: 450000, color: "bg-blue-500" },
  { category: "Utilities", amount: 85000, color: "bg-amber-500" },
  { category: "Maintenance", amount: 45000, color: "bg-red-400" },
  { category: "Food & Supplies", amount: 120000, color: "bg-emerald-500" },
  { category: "Marketing", amount: 35000, color: "bg-purple-500" },
];

export default function FinancePage() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: DashboardStats }>("/api/staff/dashboard/");
      return res.data.data;
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>("/api/staff/reservations/");
      return res.data.data ?? [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Order[]>>("/api/staff/orders/");
      return res.data.data ?? [];
    },
  });

  const totalRevenue = stats?.estimated_revenue ?? 0;
  const totalOrders = orders.filter(o => o.status === "Confirmed").reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalExpenses = EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue + totalOrders - totalExpenses;

  // Monthly revenue mock data
  const monthlyData = MONTHS.map((month, i) => ({
    month,
    revenue: Math.floor(Math.random() * 500000) + 100000,
    expenses: Math.floor(Math.random() * 300000) + 50000,
  }));

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  const handlePrint = () => {
    if (printRef.current) {
      const content = printRef.current.innerHTML;
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Finance Report - Mahameruwa Hotel</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
                h1 { font-size: 24px; color: #0a3d2c; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f8fafc; padding: 10px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                td { padding: 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
                .stat { display: inline-block; margin: 10px 20px 10px 0; }
                .stat-value { font-size: 24px; font-weight: bold; color: #0a3d2c; }
                .stat-label { font-size: 12px; color: #64748b; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `);
        win.document.close();
        win.print();
      }
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Report Type", "Finance Report - Mahameruwa Hotel"],
      ["Generated", new Date().toLocaleDateString()],
      [],
      ["REVENUE SUMMARY"],
      ["Booking Revenue", totalRevenue],
      ["Orders Revenue", totalOrders],
      ["Total Expenses", totalExpenses],
      ["Net Profit", netProfit],
      [],
      ["EXPENSE BREAKDOWN"],
      ["Category", "Amount (LKR)"],
      ...EXPENSES.map(e => [e.category, e.amount]),
      [],
      ["MONTHLY DATA"],
      ["Month", "Revenue", "Expenses"],
      ...monthlyData.map(d => [d.month, d.revenue, d.expenses]),
    ];

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports & Finance</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue, expenses and financial overview.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {(["daily", "monthly", "yearly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              period === p
                ? "bg-emerald-600 text-white border-emerald-600"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Printable Content */}
      <div ref={printRef}>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Booking Revenue", value: totalRevenue, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Orders Revenue", value: totalOrders, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
            { label: "Total Expenses", value: totalExpenses, color: "bg-red-400", light: "bg-red-50", text: "text-red-600" },
            { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "bg-teal-500" : "bg-red-400", light: netProfit >= 0 ? "bg-teal-50" : "bg-red-50", text: netProfit >= 0 ? "text-teal-700" : "text-red-600" },
          ].map(({ label, value, color, light, text }) => (
            <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className={`h-8 w-8 rounded-xl ${light} flex items-center justify-center mb-3`}>
                <div className={`h-3 w-3 rounded-full ${color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">
                LKR {value.toLocaleString()}
              </p>
              <p className={`text-xs font-medium ${text} mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Monthly Revenue vs Expenses</h2>
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map(({ month, revenue, expenses }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "120px" }}>
                    <div
                      className="bg-emerald-400 rounded-t transition-all w-full"
                      style={{ height: `${(revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-3 w-3 rounded bg-emerald-400" /> Revenue
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Expense Breakdown</h2>
            <div className="space-y-3">
              {EXPENSES.map(({ category, amount, color }) => {
                const pct = Math.round((amount / totalExpenses) * 100);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">{category}</span>
                      <span className="font-medium text-slate-900">LKR {amount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Reservation Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Reservation Summary</h2>
            <div className="space-y-3">
              {[
                { label: "Total Reservations", value: stats?.total_bookings ?? 0, color: "text-slate-900" },
                { label: "Confirmed", value: stats?.confirmed_bookings ?? 0, color: "text-emerald-700" },
                { label: "Pending", value: stats?.pending_bookings ?? 0, color: "text-amber-700" },
                { label: "Cancelled", value: stats?.cancelled_bookings ?? 0, color: "text-red-600" },
                { label: "Occupancy Rate", value: `${stats?.occupancy_rate ?? 0}%`, color: "text-blue-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Orders Revenue</h2>
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No orders yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orders.slice(0, 8).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div>
                      <p className="text-xs font-medium text-slate-900">{order.customer_name}</p>
                      <p className="text-xs text-slate-400">#{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-700">
                        LKR {Number(order.total_price).toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "Confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Reservation Revenue Details</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["#", "Guest", "Check-in", "Check-out", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No reservations found.
                  </td>
                </tr>
              ) : (
                reservations.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">#{r.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-xs">{r.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.check_in}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.check_out}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "Confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}