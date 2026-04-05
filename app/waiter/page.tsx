"use client";

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

export default function WaiterDashboard() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["waiter-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/waiter/orders/");
      return res.data.data || [];
    },
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Ready orders
  const { data: readyOrders = [] } = useQuery<Order[]>({
    queryKey: ["ready-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/waiter/orders/ready/");
      return res.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Mark served
  const servedMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiClient.post(`/api/staff/waiter/orders/${orderId}/served/`),
    onSuccess: () => {
      toast.success("Order marked as served!");
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ready-orders"] });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Preparing": return "bg-blue-100 text-blue-800";
      case "Ready": return "bg-green-100 text-green-800 animate-pulse";
      case "Completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👨‍🍳 Waiter Dashboard</h1>
        <p className="text-gray-600">Manage orders and request bills</p>
      </div>

      {/* Ready Orders Alert */}
      {readyOrders.length > 0 && (
        <div className="mb-6 rounded-xl bg-green-500 p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            <div>
              <p className="text-lg font-bold">
                {readyOrders.length} Order(s) Ready to Serve!
              </p>
              <p className="text-sm opacity-90">
                {readyOrders.map(o => o.table_number ? `Table ${o.table_number}` : `Room ${o.room}`).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg ${
              order.status === "Ready" ? "ring-2 ring-green-500" : ""
            }`}
          >
            {/* Order Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {order.table_number ? "🪑" : "🏨"}
                </span>
                <div>
                  <p className="font-bold text-gray-800">
                    {order.table_number
                      ? `Table ${order.table_number}`
                      : `Room ${order.room}`}
                  </p>
                  <p className="text-xs text-gray-500">{order.customer_name}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Items */}
            <div className="mb-3 space-y-1">
              {order.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium">x{item.quantity}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-gray-400">
                  +{order.items.length - 3} more items
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-lg font-bold text-indigo-600">
                  LKR {order.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{order.time_ago}</p>
              </div>
              
              <div className="flex gap-2">
                {order.status === "Ready" && (
                  <button
                    onClick={() => servedMutation.mutate(order.id)}
                    disabled={servedMutation.isPending}
                    className="rounded-lg bg-green-500 px-3 py-2 text-sm font-bold text-white hover:bg-green-600"
                  >
                    ✓ Served
                  </button>
                )}
                
                {order.status === "Completed" && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-600"
                  >
                    💳 Bill
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Request Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">💳 Request Bill</h2>
            
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="text-lg font-bold">
                {selectedOrder.table_number
                  ? `Table ${selectedOrder.table_number}`
                  : `Room ${selectedOrder.room}`}
              </p>
              <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                LKR {selectedOrder.total.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => billMutation.mutate(selectedOrder.id)}
                disabled={billMutation.isPending}
                className="flex-1 rounded-xl bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-600"
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