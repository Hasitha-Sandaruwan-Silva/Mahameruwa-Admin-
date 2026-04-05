"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../utils/api";
import toast from "react-hot-toast";

interface KitchenOrderItem {
  name: string;
  quantity: number;
  category?: string;
}

interface KitchenOrder {
  id: number;
  table_number: string | null;
  room: string | null;
  customer_name?: string;
  items: KitchenOrderItem[];
  status: string;
  waiting_minutes: number;
  is_urgent: boolean;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function KitchenDisplayPage() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch kitchen orders - auto refresh every 5 seconds
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["kitchen-display-orders"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<KitchenOrder[]>>("/api/staff/kitchen/orders/");
      return res.data.data || [];
    },
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Start preparing mutation
  const startPreparingMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiClient.post(`/api/staff/kitchen/orders/${orderId}/start/`);
    },
    onSuccess: () => {
      toast.success("🍳 Started preparing!");
      queryClient.invalidateQueries({ queryKey: ["kitchen-display-orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed");
    },
  });

  // Mark ready mutation
  const markReadyMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiClient.post(`/api/staff/kitchen/orders/${orderId}/ready/`);
    },
    onSuccess: () => {
      toast.success("✅ Order ready for serving!");
      // Play sound notification
      playNotificationSound();
      queryClient.invalidateQueries({ queryKey: ["kitchen-display-orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed");
    },
  });

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/sounds/ready.mp3");
      audio.play();
    } catch (e) {
      console.log("Sound not available");
    }
  };

  // Separate orders by status
  const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed");
  const preparingOrders = orders.filter((o) => o.status === "Preparing");
  const readyOrders = orders.filter((o) => o.status === "Ready");

  // Stats
  const stats = {
    pending: pendingOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
    total: orders.length,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">👨‍🍳</span>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-slate-400">
                {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="rounded-xl bg-amber-500/20 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-xs text-amber-300">Pending</p>
            </div>
            <div className="rounded-xl bg-blue-500/20 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.preparing}</p>
              <p className="text-xs text-blue-300">Preparing</p>
            </div>
            <div className="rounded-xl bg-emerald-500/20 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.ready}</p>
              <p className="text-xs text-emerald-300">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="grid h-[calc(100vh-80px)] grid-cols-3 gap-4 p-4">
        {/* Column 1: PENDING */}
        <div className="flex flex-col rounded-2xl bg-slate-800 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500"></span>
            <h2 className="text-lg font-bold text-amber-400">
              ⏳ PENDING ({stats.pending})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                No pending orders
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  color="amber"
                  actionButton={
                    <button
                      onClick={() => startPreparingMutation.mutate(order.id)}
                      disabled={startPreparingMutation.isPending}
                      className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      🍳 START PREPARING
                    </button>
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: PREPARING */}
        <div className="flex flex-col rounded-2xl bg-slate-800 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-blue-500"></span>
            <h2 className="text-lg font-bold text-blue-400">
              👨‍🍳 PREPARING ({stats.preparing})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                No orders cooking
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  color="blue"
                  actionButton={
                    <button
                      onClick={() => markReadyMutation.mutate(order.id)}
                      disabled={markReadyMutation.isPending}
                      className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      ✅ MARK READY
                    </button>
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: READY */}
        <div className="flex flex-col rounded-2xl bg-slate-800 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-emerald-400">
              ✅ READY ({stats.ready})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                No orders ready
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  color="emerald"
                  actionButton={
                    <div className="w-full rounded-xl bg-emerald-600/30 py-3 text-center text-sm font-bold text-emerald-300">
                      🔔 WAITING FOR WAITER
                    </div>
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Order Alert */}
      {stats.pending > 0 && (
        <div className="fixed bottom-4 right-4 animate-bounce">
          <div className="rounded-full bg-amber-500 px-6 py-3 text-lg font-bold shadow-lg">
            🔔 {stats.pending} NEW ORDER(S)!
          </div>
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  color,
  actionButton,
}: {
  order: KitchenOrder;
  color: "amber" | "blue" | "emerald";
  actionButton: React.ReactNode;
}) {
  const colorClasses = {
    amber: "border-amber-500/30 bg-amber-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
  };

  const urgentClass = order.is_urgent ? "ring-2 ring-red-500 animate-pulse" : "";

  return (
    <div
      className={`rounded-xl border-2 p-4 ${colorClasses[color]} ${urgentClass}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Order #{order.id}</p>
          <p className="text-lg font-bold text-white">
            {order.table_number
              ? `🪑 Table ${order.table_number}`
              : order.room
              ? `🏨 Room ${order.room}`
              : "🚶 Walk-in"}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-lg font-bold ${
              order.is_urgent ? "text-red-400" : "text-slate-300"
            }`}
          >
            {order.waiting_minutes} min
          </p>
          {order.is_urgent && (
            <p className="text-xs text-red-400">⚠️ URGENT</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2 rounded-lg bg-slate-900/50 p-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-white">{item.name}</span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-sm font-bold text-white">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {actionButton}
    </div>
  );
}