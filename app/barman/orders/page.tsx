"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  status: string;
}

interface Room {
  id: number;
  room_number?: string;
  category: string;
  name?: string;
}

interface Order {
  id: number;
  customer_name: string;
  room: number;
  menu_items: number[];
  menu_items_detail?: MenuItem[];
  total_price: number;
  status: "Pending" | "Confirmed" | "Cancelled";
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type OrderStatus = "Pending" | "Confirmed" | "Cancelled";

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const emptyForm = {
  customer_name: "",
  room: "",
  menu_items: [] as number[],
  status: "Pending" as OrderStatus,
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function OrdersPage() {
  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form states
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ──────────────────────────────────────────────
  // Fetch Data
  // ──────────────────────────────────────────────

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<Order[]>>("/api/staff/orders/");
      setOrders(res.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await apiClient.get<ApiResponse<MenuItem[]>>("/api/staff/menu/");
      setMenuItems((res.data.data || []).filter((item) => item.status === "active"));
    } catch (error: any) {
      console.error("Failed to load menu items", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      setRooms(res.data.data || []);
    } catch (error: any) {
      console.error("Failed to load rooms", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    fetchRooms();
  }, []);

  // ──────────────────────────────────────────────
  // Form Handlers
  // ──────────────────────────────────────────────

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.room) {
      toast.error("Please select a room");
      return;
    }
    if (form.menu_items.length === 0) {
      toast.error("Please select at least one menu item");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_name: form.customer_name.trim(),
        room: Number(form.room),
        menu_items: form.menu_items,
        status: form.status,
      };

      if (editingId) {
        await apiClient.put(`/api/staff/orders/${editingId}/`, payload);
        toast.success("Order updated successfully");
      } else {
        await apiClient.post("/api/staff/orders/", payload);
        toast.success("Order created successfully");
      }

      resetForm();
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setForm({
      customer_name: order.customer_name,
      room: String(order.room),
      menu_items: order.menu_items,
      status: order.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await apiClient.put(`/api/staff/orders/${orderId}/`, { status: newStatus });
      toast.success(`Order ${newStatus.toLowerCase()}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await apiClient.delete(`/api/staff/orders/${id}/`);
      toast.success("Order deleted");
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete order");
    }
  };

  const toggleMenuItem = (itemId: number) => {
    setForm((prev) => ({
      ...prev,
      menu_items: prev.menu_items.includes(itemId)
        ? prev.menu_items.filter((id) => id !== itemId)
        : [...prev.menu_items, itemId],
    }));
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // ──────────────────────────────────────────────
  // Computed Values
  // ──────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(q) ||
          order.id.toString().includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, search]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "Pending").length;
    const confirmed = orders.filter((o) => o.status === "Confirmed").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const totalRevenue = orders
      .filter((o) => o.status === "Confirmed")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    return { total: orders.length, pending, confirmed, cancelled, totalRevenue };
  }, [orders]);

  const selectedItemsTotal = useMemo(() => {
    return form.menu_items.reduce((sum, itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
      return sum + (item?.price || 0);
    }, 0);
  }, [form.menu_items, menuItems]);

  const getRoomName = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || room?.room_number || `Room #${roomId}`;
  };

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer orders and track order status
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          {showForm ? (
            <>
              <span>✕</span> Close Form
            </>
          ) : (
            <>
              <span>+</span> New Order
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Confirmed</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.confirmed}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-red-800">{stats.cancelled}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-violet-800">
            LKR {stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Order" : "Create New Order"}
              </h2>
              <p className="text-sm text-slate-500">
                {editingId ? "Update order details" : "Fill in the order information"}
              </p>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Room Selection */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Room <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.room}
                  onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name || room.room_number || `Room #${room.id}`} - {room.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Menu Items Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Menu Items <span className="text-red-500">*</span>
                </label>
                <span className="text-sm font-semibold text-emerald-600">
                  Total: LKR {selectedItemsTotal.toLocaleString()}
                </span>
              </div>

              {menuItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                  No menu items available. Please add menu items first.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {menuItems.map((item) => {
                    const isSelected = form.menu_items.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleMenuItem(item.id)}
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? "text-emerald-900" : "text-slate-900"}`}>
                              {item.name}
                            </p>
                            <p className={`text-xs ${isSelected ? "text-emerald-600" : "text-slate-500"}`}>
                              {item.category}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className={`text-sm font-bold ${isSelected ? "text-emerald-700" : "text-slate-700"}`}>
                              LKR {item.price.toLocaleString()}
                            </p>
                            {isSelected && (
                              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                  ? "Update Order"
                  : "Create Order"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", "Pending", "Confirmed", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "All Orders" : status}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or order ID..."
          className="w-full sm:w-72 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Room
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Items
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      <span className="text-sm text-slate-500">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    {search || statusFilter !== "all"
                      ? "No orders match your filters"
                      : "No orders yet. Create your first order!"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">#{order.id}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{order.customer_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getRoomName(order.room)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          {order.menu_items?.length || 0} items →
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">
                          LKR {Number(order.total_price || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {order.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order.id, "Confirmed")}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleStatusChange(order.id, "Cancelled")}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(order)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Order #{selectedOrder.id} Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Customer</p>
                  <p className="font-medium text-slate-900">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Room</p>
                  <p className="font-medium text-slate-900">{getRoomName(selectedOrder.room)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].text}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.menu_items_detail?.length ? (
                    selectedOrder.menu_items_detail.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          LKR {item.price.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      {selectedOrder.menu_items?.length || 0} items selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-lg font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-emerald-600">
                  LKR {Number(selectedOrder.total_price || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {selectedOrder.status === "Pending" && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, "Confirmed");
                      setShowDetailModal(false);
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, "Cancelled");
                      setShowDetailModal(false);
                    }}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}