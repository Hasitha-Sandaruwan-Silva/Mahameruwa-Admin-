"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";

interface Order {
  id: number;
  room_number: string;
  menu_item_name: string;
  quantity: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Preparing: "bg-blue-100 text-blue-700",
  Ready: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-slate-100 text-slate-500",
};

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("active");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Order[]>>("/api/staff/orders/");
      return res.data.data ?? [];
    },
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiClient.put(`/api/staff/orders/${id}/`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") return ["Pending", "Preparing", "Ready"].includes(o.status);
    if (filter === "all") return true;
    return o.status === filter;
  });

  const counts = {
    pending: orders.filter((o) => o.status === "Pending").length,
    preparing: orders.filter((o) => o.status === "Preparing").length,
    ready: orders.filter((o) => o.status === "Ready").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kitchen Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time order tracking</p>
        </div>
        {counts.ready > 0 && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">{counts.ready} Ready!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{counts.pending}</div>
          <div className="text-xs text-amber-600">⏳ Pending</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{counts.preparing}</div>
          <div className="text-xs text-blue-600">👨‍🍳 Preparing</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{counts.ready}</div>
          <div className="text-xs text-emerald-600">✅ Ready</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["active", "Pending", "Preparing", "Ready", "Delivered", "all"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === key
                ? "bg-emerald-600 text-white border-emerald-600"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {key === "active" ? "Active" : key === "all" ? "All" : key}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-4 h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-slate-500">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all ${
                order.status === "Ready" ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"
              }`}
            >
              <div className="flex justify-between mb-3">
                <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900 mb-1">{order.menu_item_name || "Order"}</h3>
              <p className="text-sm text-slate-500 mb-3">Qty: {order.quantity}</p>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl mb-3">
                <span>🚪</span>
                <span className="font-medium text-sm">Room {order.room_number || "—"}</span>
              </div>

              {order.notes && (
                <div className="bg-amber-50 rounded-xl p-2 mb-3 text-xs text-amber-700">
                  📝 {order.notes}
                </div>
              )}

              <p className="text-xs text-slate-400 mb-3">
                {new Date(order.created_at).toLocaleTimeString()}
              </p>

              {order.status === "Pending" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "Preparing" })}
                  className="w-full py-2 rounded-xl bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                >
                  Start Preparing
                </button>
              )}
              {order.status === "Preparing" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "Ready" })}
                  className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                  Mark Ready
                </button>
              )}
              {order.status === "Ready" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "Delivered" })}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                >
                  ✓ Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}