"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import { MenuItem, Room } from "../../../utils/types";
import toast from "react-hot-toast";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function NewOrderPage() {
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["waiter-menu"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MenuItem[]>>("/api/staff/menu/");
      return res.data.data.filter((item) => item.status === "active");
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["waiter-rooms"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return res.data.data.filter((r) => r.status === "active");
    },
  });

  const totalPrice = selectedItems.reduce((sum, id) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? Number(item.price) : 0);
  }, 0);

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/staff/orders/", {
        customer_name: customerName,
        room: selectedRoom,
        menu_items: selectedItems,
      });
    },
    onSuccess: () => {
      toast.success("Order created!");
      setCustomerName("");
      setSelectedRoom(null);
      setSelectedItems([]);
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
    },
    onError: () => toast.error("Failed to create order"),
  });

  const handleSubmit = () => {
    if (!customerName.trim()) return toast.error("Customer name required");
    if (!selectedRoom) return toast.error("Please select a room");
    if (selectedItems.length === 0) return toast.error("Select at least one menu item");
    createOrder.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New Order</h1>
        <p className="text-sm text-slate-500 mt-1">Create a new room food order.</p>
      </div>

      {/* Customer Name */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <label className="text-sm font-medium text-slate-700">Customer Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Room Select */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <label className="text-sm font-medium text-slate-700">Select Room</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                selectedRoom === room.id
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <label className="text-sm font-medium text-slate-700">Select Menu Items</label>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                selectedItems.includes(item.id)
                  ? "bg-emerald-50 border-emerald-300"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600">
                  LKR {Number(item.price).toLocaleString()}
                </span>
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                  selectedItems.includes(item.id)
                    ? "bg-emerald-600 border-emerald-600"
                    : "border-slate-300"
                }`}>
                  {selectedItems.includes(item.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total + Submit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Total Price</p>
          <p className="text-lg font-bold text-emerald-600">
            LKR {totalPrice.toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-70"
        >
          {createOrder.isPending ? "Creating..." : "Create Order"}
        </button>
      </div>
    </div>
  );
}
