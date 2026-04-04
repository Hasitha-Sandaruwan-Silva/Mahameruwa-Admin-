"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  status: "active" | "inactive";
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

const DRINK_CATEGORIES = [
  "Cocktails",
  "Mocktails",
  "Beer",
  "Wine",
  "Spirits",
  "Soft Drinks",
  "Coffee",
  "Tea",
  "Juice",
  "Water",
  "Energy Drinks",
  "Other",
];

const emptyDrinkForm = {
  name: "",
  category: "Cocktails",
  price: 0,
  description: "",
  status: "active" as "active" | "inactive",
};

const emptyOrderForm = {
  customer_name: "",
  room: "",
  menu_items: [] as number[],
  status: "Pending" as OrderStatus,
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function BarmanMenuPage() {
  const [drinks, setDrinks] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  const [searchMenu, setSearchMenu] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchOrder, setSearchOrder] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [drinkForm, setDrinkForm] = useState(emptyDrinkForm);
  const [editingDrinkId, setEditingDrinkId] = useState<number | null>(null);
  const [showDrinkForm, setShowDrinkForm] = useState(false);

  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // BARCODE SCANNER STATE
  const [barcodeInput, setBarcodeInput] = useState("");

  // ══════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════

  const fetchDrinks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<MenuItem[]>>("/api/staff/menu/");
      const allItems = res.data.data || [];
      const drinkItems = allItems.filter((item) => DRINK_CATEGORIES.includes(item.category));
      setDrinks(drinkItems);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load drinks");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<ApiResponse<Order[]>>("/api/staff/orders/");
      setOrders(res.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
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
    fetchDrinks();
    fetchOrders();
    fetchRooms();
  }, []);

  // ══════════════════════════════════════════════
  // MENU HANDLERS
  // ══════════════════════════════════════════════

  const resetDrinkForm = () => {
    setDrinkForm(emptyDrinkForm);
    setEditingDrinkId(null);
    setShowDrinkForm(false);
  };

  const handleDrinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drinkForm.name.trim()) {
      toast.error("Drink name is required");
      return;
    }
    if (drinkForm.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: drinkForm.name.trim(),
        category: drinkForm.category,
        price: Number(drinkForm.price),
        description: drinkForm.description.trim(),
        status: drinkForm.status,
      };

      if (editingDrinkId) {
        await apiClient.put(`/api/staff/menu/${editingDrinkId}/`, payload);
        toast.success("Drink updated successfully");
      } else {
        await apiClient.post("/api/staff/menu/", payload);
        toast.success("Drink added successfully");
      }

      resetDrinkForm();
      fetchDrinks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save drink");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDrink = (drink: MenuItem) => {
    setEditingDrinkId(drink.id);
    setDrinkForm({
      name: drink.name,
      category: drink.category,
      price: drink.price,
      description: drink.description || "",
      status: drink.status,
    });
    setShowDrinkForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDrink = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this drink?")) return;
    try {
      await apiClient.delete(`/api/staff/menu/${id}/`);
      toast.success("Drink deleted");
      fetchDrinks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete drink");
    }
  };

  const handleToggleStatus = async (drink: MenuItem) => {
    try {
      const newStatus = drink.status === "active" ? "inactive" : "active";
      await apiClient.put(`/api/staff/menu/${drink.id}/`, { status: newStatus });
      toast.success(`Drink ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchDrinks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  // BARCODE PRINTING
  const printBarcode = (drink: MenuItem) => {
    const barcodeText = `BTL-${drink.id}`;
    // Using a free reliable API to generate barcode image
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcodeText}&scale=3&includetext`;

    const printWindow = window.open("", "_blank");
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${drink.name}</title>
          <style>
            body { text-align: center; font-family: sans-serif; padding-top: 50px; }
            h3 { margin: 0; font-size: 24px; color: #333; }
            p { margin: 5px 0 20px 0; font-size: 18px; color: #666; font-weight: bold; }
            img { max-width: 100%; height: 100px; }
          </style>
        </head>
        <body>
          <h3>${drink.name}</h3>
          <p>LKR ${drink.price.toLocaleString()}</p>
          <img src="${barcodeUrl}" alt="Barcode" />
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close(); 
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };

  // ══════════════════════════════════════════════
  // ORDER HANDLERS (BILLING)
  // ══════════════════════════════════════════════

  const resetOrderForm = () => {
    setOrderForm(emptyOrderForm);
    setEditingOrderId(null);
    setShowOrderForm(false);
    setBarcodeInput("");
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!orderForm.room) {
      toast.error("Please select a room");
      return;
    }
    if (orderForm.menu_items.length === 0) {
      toast.error("Please select at least one drink");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_name: orderForm.customer_name.trim(),
        room: Number(orderForm.room),
        menu_items: orderForm.menu_items,
        status: orderForm.status,
      };

      if (editingOrderId) {
        await apiClient.put(`/api/staff/orders/${editingOrderId}/`, payload);
        toast.success("Order updated successfully");
      } else {
        await apiClient.post("/api/staff/orders/", payload);
        toast.success("Order created successfully");
      }

      resetOrderForm();
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setOrderForm({
      customer_name: order.customer_name,
      room: String(order.room),
      menu_items: order.menu_items,
      status: order.status,
    });
    setShowOrderForm(true);
    setActiveTab("orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await apiClient.put(`/api/staff/orders/${orderId}/`, { status: newStatus });
      toast.success(`Order ${newStatus.toLowerCase()}`);
      fetchOrders();
      if (showDetailModal) setShowDetailModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await apiClient.delete(`/api/staff/orders/${id}/`);
      toast.success("Order deleted");
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete order");
    }
  };

  const toggleDrink = (drinkId: number) => {
    setOrderForm((prev) => ({
      ...prev,
      menu_items: prev.menu_items.includes(drinkId)
        ? prev.menu_items.filter((id) => id !== drinkId)
        : [...prev.menu_items, drinkId],
    }));
  };

  // BARCODE SCANNING LOGIC
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeInput.trim().toUpperCase();
      if (!code) return;

      // Extract ID from format "BTL-15"
      const match = code.match(/^BTL-(\d+)$/);
      if (match) {
        const itemId = parseInt(match[1], 10);
        const drink = drinks.find((d) => d.id === itemId && d.status === "active");

        if (drink) {
          if (!orderForm.menu_items.includes(drink.id)) {
            setOrderForm((prev) => ({
              ...prev,
              menu_items: [...prev.menu_items, drink.id],
            }));
            toast.success(`${drink.name} added to bill!`);
          } else {
            toast.success(`${drink.name} is already in the bill.`);
          }
        } else {
          toast.error("Drink not found or is inactive!");
        }
      } else {
        toast.error("Invalid Barcode format!");
      }
      setBarcodeInput(""); // Clear input for next scan
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // ══════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════

  const filteredDrinks = useMemo(() => {
    let result = drinks;
    if (categoryFilter !== "all") {
      result = result.filter((drink) => drink.category === categoryFilter);
    }
    const q = searchMenu.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (drink) =>
          drink.name.toLowerCase().includes(q) ||
          drink.category.toLowerCase().includes(q) ||
          drink.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [drinks, categoryFilter, searchMenu]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }
    const q = searchOrder.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(q) ||
          order.id.toString().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, searchOrder]);

  const menuStats = useMemo(() => {
    const active = drinks.filter((d) => d.status === "active").length;
    const inactive = drinks.filter((d) => d.status === "inactive").length;
    const categories = [...new Set(drinks.map((d) => d.category))].length;
    const avgPrice =
      drinks.length > 0 ? drinks.reduce((sum, d) => sum + Number(d.price), 0) / drinks.length : 0;
    return { total: drinks.length, active, inactive, categories, avgPrice };
  }, [drinks]);

  const orderStats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "Pending").length;
    const confirmed = orders.filter((o) => o.status === "Confirmed").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const totalRevenue = orders
      .filter((o) => o.status === "Confirmed")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    return { total: orders.length, pending, confirmed, cancelled, totalRevenue };
  }, [orders]);

  const selectedDrinksTotal = useMemo(() => {
    return orderForm.menu_items.reduce((sum, drinkId) => {
      const drink = drinks.find((d) => d.id === drinkId);
      return sum + (drink?.price || 0);
    }, 0);
  }, [orderForm.menu_items, drinks]);

  const getRoomName = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || room?.room_number || `Room #${roomId}`;
  };

  const activeDrinks = useMemo(() => {
    return drinks.filter((d) => d.status === "active");
  }, [drinks]);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">🍹 Drink Menu</h1>
          <p className="mt-1 text-sm text-slate-500">Manage bar drinks and create drink orders</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === "menu") {
              resetDrinkForm();
              setShowDrinkForm(!showDrinkForm);
            } else {
              resetOrderForm();
              setShowOrderForm(!showOrderForm);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 transition-colors"
        >
          {(activeTab === "menu" && showDrinkForm) || (activeTab === "orders" && showOrderForm) ? (
            <>
              <span>✕</span> Close Form
            </>
          ) : (
            <>
              <span>+</span> {activeTab === "menu" ? "Add Drink" : "New Order"}
            </>
          )}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "menu" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🍸 Drinks Menu
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "orders" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          📋 Bar Orders
          {orderStats.pending > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
              {orderStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* MENU TAB */}
      {activeTab === "menu" && (
        <>
          {/* Menu Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Drinks</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{menuStats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Active</p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">{menuStats.active}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Inactive</p>
              <p className="mt-2 text-2xl font-bold text-slate-700">{menuStats.inactive}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">Categories</p>
              <p className="mt-2 text-2xl font-bold text-violet-800">{menuStats.categories}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-rose-700 uppercase tracking-wide">Avg Price</p>
              <p className="mt-2 text-2xl font-bold text-rose-800">LKR {menuStats.avgPrice.toFixed(0)}</p>
            </div>
          </div>

          {/* Drink Form */}
          {showDrinkForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingDrinkId ? "Edit Drink" : "Add New Drink"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editingDrinkId ? "Update drink details" : "Add a new drink to the bar menu"}
                  </p>
                </div>
                {editingDrinkId && (
                  <button
                    onClick={resetDrinkForm}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleDrinkSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Drink Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={drinkForm.name}
                      onChange={(e) => setDrinkForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Mojito"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      value={drinkForm.category}
                      onChange={(e) => setDrinkForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    >
                      {DRINK_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="text-slate-900 bg-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Price (LKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={drinkForm.price}
                      onChange={(e) => setDrinkForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="850"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={drinkForm.status}
                      onChange={(e) => setDrinkForm((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    >
                      <option value="active" className="text-slate-900 bg-white">Active</option>
                      <option value="inactive" className="text-slate-900 bg-white">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={drinkForm.description}
                    onChange={(e) => setDrinkForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Refreshing mint cocktail with lime and soda..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (editingDrinkId ? "Updating..." : "Adding...") : (editingDrinkId ? "Update Drink" : "Add Drink")}
                  </button>
                  <button
                    type="button"
                    onClick={resetDrinkForm}
                    className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Menu Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === "all" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {DRINK_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    categoryFilter === cat ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500"
              >
                <option value="all" className="text-slate-900 bg-white">More...</option>
                {DRINK_CATEGORIES.slice(6).map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900 bg-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={searchMenu}
              onChange={(e) => setSearchMenu(e.target.value)}
              placeholder="Search drinks..."
              className="w-full sm:w-64 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          {/* Drinks Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 h-44">
                  <div className="h-4 w-24 rounded bg-slate-200 mb-2" />
                  <div className="h-3 w-16 rounded bg-slate-100 mb-4" />
                  <div className="h-3 w-full rounded bg-slate-100 mb-2" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))
            ) : filteredDrinks.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-lg text-slate-400 mb-2">🍹</p>
                <p className="text-slate-500">
                  {searchMenu || categoryFilter !== "all" ? "No drinks match your filters" : "No drinks yet. Add your first drink!"}
                </p>
              </div>
            ) : (
              filteredDrinks.map((drink) => (
                <div
                  key={drink.id}
                  className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${
                    drink.status === "inactive" ? "border-slate-200 opacity-60" : "border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{drink.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{drink.category}</p>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(drink)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          drink.status === "active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {drink.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </div>

                    {drink.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{drink.description}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <span className="text-lg font-bold text-rose-600">LKR {drink.price.toLocaleString()}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* BARCODE BUTTON */}
                      <button
                        onClick={() => printBarcode(drink)}
                        title="Print Barcode"
                        className="rounded-lg border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        🖨️
                      </button>

                      <button
                        onClick={() => handleEditDrink(drink)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDrink(drink.id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <>
          {/* Order Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{orderStats.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Pending</p>
              <p className="mt-2 text-2xl font-bold text-amber-800">{orderStats.pending}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">{orderStats.confirmed}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancelled</p>
              <p className="mt-2 text-2xl font-bold text-red-800">{orderStats.cancelled}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">Revenue</p>
              <p className="mt-2 text-2xl font-bold text-violet-800">LKR {orderStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Order Form */}
          {showOrderForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{editingOrderId ? "Edit Order" : "Create New Order"}</h2>
                  <p className="text-sm text-slate-500">{editingOrderId ? "Update order details" : "Create a new bar order"}</p>
                </div>
                {editingOrderId && (
                  <button
                    onClick={resetOrderForm}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orderForm.customer_name}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Enter customer name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Room <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={orderForm.room}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, room: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    >
                      <option value="" className="text-slate-500 bg-white">Select a room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id} className="text-slate-900 bg-white">
                          {room.name || room.room_number || `Room #${room.id}`} - {room.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    >
                      <option value="Pending" className="text-slate-900 bg-white">Pending</option>
                      <option value="Confirmed" className="text-slate-900 bg-white">Confirmed</option>
                      <option value="Cancelled" className="text-slate-900 bg-white">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* BARCODE SCANNER INPUT */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <label className="text-sm font-medium text-indigo-900 flex items-center gap-2 mb-2">
                    📷 Scan Barcode to Add Drink
                  </label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    placeholder="Scan bottle barcode here and press Enter..."
                    className="w-full rounded-lg border border-indigo-200 px-4 py-3 text-sm text-indigo-900 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-inner"
                  />
                  <p className="text-xs text-indigo-500 mt-1.5">
                    * Make sure to click inside this box before scanning. (Format: BTL-123)
                  </p>
                </div>

                {/* Drinks Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Or Select Manually <span className="text-red-500">*</span>
                    </label>
                    <span className="text-sm font-bold text-rose-600">Total: LKR {selectedDrinksTotal.toLocaleString()}</span>
                  </div>

                  {activeDrinks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                      <p className="text-slate-500">No active drinks available. Add drinks first.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {activeDrinks.map((drink) => {
                        const isSelected = orderForm.menu_items.includes(drink.id);
                        return (
                          <div
                            key={drink.id}
                            onClick={() => toggleDrink(drink.id)}
                            className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                              isSelected ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? "text-rose-900" : "text-slate-900"}`}>
                                  {drink.name}
                                </p>
                                <p className={`text-xs ${isSelected ? "text-rose-600" : "text-slate-500"}`}>{drink.category}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                <p className={`text-sm font-bold ${isSelected ? "text-rose-700" : "text-slate-700"}`}>
                                  LKR {drink.price.toLocaleString()}
                                </p>
                                {isSelected && (
                                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs">
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

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (editingOrderId ? "Updating..." : "Creating...") : (editingOrderId ? "Update Order" : "Create Order")}
                  </button>
                  <button type="button" onClick={resetOrderForm} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Order Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {["all", "Pending", "Confirmed", "Cancelled"].map((stat) => (
                <button
                  key={stat}
                  onClick={() => setStatusFilter(stat)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === stat ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {stat === "all" ? "All Orders" : stat}
                  {stat === "Pending" && orderStats.pending > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/30 px-1 text-xs">
                      {orderStats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              placeholder="Search by customer or ID..."
              className="w-full sm:w-64 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          {/* Orders Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Room</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Items</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-rose-600" />
                          <span className="text-sm text-slate-500">Loading orders...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                        {searchOrder || statusFilter !== "all" ? "No orders match your filters" : "No orders yet. Create your first order!"}
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
                            <button onClick={() => viewOrderDetails(order)} className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                              {order.menu_items?.length || 0} items →
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">LKR {Number(order.total_price || 0).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
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
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(order.id, "Cancelled")}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Del
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
        </>
      )}

      {/* ORDER DETAILS MODAL */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Order #{selectedOrder.id}</h3>
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
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
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].text}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Order Items</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.menu_items_detail?.length ? (
                    selectedOrder.menu_items_detail.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">LKR {item.price.toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{selectedOrder.menu_items?.length || 0} items</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-lg font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-rose-600">LKR {Number(selectedOrder.total_price || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {selectedOrder.status === "Pending" && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "Confirmed")}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "Cancelled")}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
              <button onClick={() => setShowDetailModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}