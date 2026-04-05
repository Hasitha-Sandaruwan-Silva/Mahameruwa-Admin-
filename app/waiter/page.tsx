"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../utils/api";
import toast from "react-hot-toast";

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

interface Order {
  id: number;
  table_number: string | null;
  room: string | null;
  customer_name: string;
  items: OrderItem[];
  items_count: number;
  total: number;
  status: string;
  time_ago: string;
  created_at: string;
}

interface Table {
  id: number;
  table_number: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-sky-100 text-sky-800",
  Preparing: "bg-blue-100 text-blue-800",
  Ready: "bg-emerald-100 text-emerald-800 animate-pulse",
  Completed: "bg-slate-100 text-slate-800",
  "Bill Requested": "bg-purple-100 text-purple-800",
  Paid: "bg-green-100 text-green-800",
};

export default function WaiterDashboard() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch all active orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["waiter-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/waiter/orders/");
      return res.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch ready orders
  const { data: readyOrders = [] } = useQuery<Order[]>({
    queryKey: ["waiter-ready-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/waiter/orders/ready/");
      return res.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch tables
  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["waiter-tables"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/pos/tables/");
      return res.data.data || [];
    },
  });

  // Mark served
  const servedMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiClient.post(`/api/staff/waiter/orders/${orderId}/served/`),
    onSuccess: () => {
      toast.success("Order marked as served!");
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-ready-orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed");
    },
  });

  // Request bill
  const billMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiClient.post(`/api/staff/waiter/orders/${orderId}/request-bill/`),
    onSuccess: () => {
      toast.success("Bill request sent to manager!");
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed");
    },
  });

  // Stats
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const preparingCount = orders.filter((o) => o.status === "Preparing").length;
  const readyCount = readyOrders.length;
  const occupiedTables = tables.filter((t) => t.status === "Occupied").length;
  const availableTables = tables.filter((t) => t.status === "Available").length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              👨‍🍳 Waiter Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Manage orders and request bills
            </p>
          </div>
          <Link
            href="/waiter/new-order"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            + New Order
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Ready Orders Alert */}
        {readyCount > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🔔</span>
              <div>
                <p className="text-xl font-bold">
                  {readyCount} Order(s) Ready to Serve!
                </p>
                <p className="text-sm opacity-90">
                  {readyOrders
                    .map((o) =>
                      o.table_number ? `Table ${o.table_number}` : `Room ${o.room}`
                    )
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Preparing</p>
            <p className="text-3xl font-bold text-blue-600">{preparingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Ready</p>
            <p className="text-3xl font-bold text-emerald-600">{readyCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Occupied Tables</p>
            <p className="text-3xl font-bold text-purple-600">{occupiedTables}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Available Tables</p>
            <p className="text-3xl font-bold text-slate-600">{availableTables}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/waiter/new-order"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md"
          >
            <span className="text-3xl">📝</span>
            <div>
              <p className="font-bold text-slate-800">New Order</p>
              <p className="text-xs text-slate-500">Take customer order</p>
            </div>
          </Link>
          <Link
            href="/waiter/tables"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md"
          >
            <span className="text-3xl">🪑</span>
            <div>
              <p className="font-bold text-slate-800">Tables</p>
              <p className="text-xs text-slate-500">View table status</p>
            </div>
          </Link>
          <Link
            href="/waiter/kitchen"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md"
          >
            <span className="text-3xl">👨‍🍳</span>
            <div>
              <p className="font-bold text-slate-800">Kitchen</p>
              <p className="text-xs text-slate-500">Track orders</p>
            </div>
          </Link>
          <Link
            href="/waiter/menu"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md"
          >
            <span className="text-3xl">🍽️</span>
            <div>
              <p className="font-bold text-slate-800">Menu</p>
              <p className="text-xs text-slate-500">Browse items</p>
            </div>
          </Link>
        </div>

        {/* Orders */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-800">Active Orders</h2>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <span className="text-5xl">📭</span>
              <p className="mt-4 text-slate-500">No active orders</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md ${
                    order.status === "Ready" ? "ring-2 ring-emerald-500" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {order.table_number ? "🪑" : "🏨"}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {order.table_number
                            ? `Table ${order.table_number}`
                            : `Room ${order.room}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="mb-3 space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-slate-400">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-lg font-bold text-emerald-600">
                        LKR {order.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">{order.time_ago}</p>
                    </div>

                    <div className="flex gap-2">
                      {order.status === "Ready" && (
                        <button
                          onClick={() => servedMutation.mutate(order.id)}
                          disabled={servedMutation.isPending}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                          ✓ Served
                        </button>
                      )}

                      {order.status === "Completed" && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg bg-purple-500 px-3 py-2 text-sm font-bold text-white hover:bg-purple-600"
                        >
                          💳 Bill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bill Request Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              💳 Request Bill
            </h2>

            <div className="mb-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-lg font-bold text-slate-800">
                {selectedOrder.table_number
                  ? `Table ${selectedOrder.table_number}`
                  : `Room ${selectedOrder.room}`}
              </p>
              <p className="text-sm text-slate-600">
                {selectedOrder.customer_name}
              </p>
              <p className="mt-3 text-2xl font-bold text-emerald-600">
                LKR {selectedOrder.total.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => billMutation.mutate(selectedOrder.id)}
                disabled={billMutation.isPending}
                className="flex-1 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {billMutation.isPending ? "Sending..." : "Send to Manager"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}