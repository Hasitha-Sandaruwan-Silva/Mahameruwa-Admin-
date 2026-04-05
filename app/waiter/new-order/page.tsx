"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  location: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  has_subcategories?: boolean;
  subcategories?: { id: string; name: string; icon: string }[];
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function WaiterNewOrderPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTable = searchParams.get("table");

  const [step, setStep] = useState<"table" | "menu">(
    preselectedTable ? "menu" : "table"
  );
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ["pos-tables"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Table[]>>("/api/staff/pos/tables/");
      const data = res.data.data || [];
      if (preselectedTable && !selectedTable) {
        const found = data.find((t) => t.table_number === preselectedTable);
        if (found) setSelectedTable(found);
      }
      return data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["pos-categories"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Category[]>>("/api/staff/pos/categories/");
      return res.data.data || [];
    },
  });

  const activeCategory = useMemo(() => {
    return categories.find((cat) => cat.id === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const menuEndpoint = useMemo(() => {
    if (selectedSubcategory) return `/api/staff/pos/menu/${selectedSubcategory}/`;
    if (selectedCategory && !activeCategory?.has_subcategories) {
      return `/api/staff/pos/menu/${selectedCategory}/`;
    }
    return null;
  }, [selectedCategory, selectedSubcategory, activeCategory]);

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["pos-menu", selectedCategory, selectedSubcategory],
    queryFn: async () => {
      if (!menuEndpoint) return [];
      const res = await apiClient.get<ApiResponse<MenuItem[]>>(menuEndpoint);
      return res.data.data || [];
    },
    enabled: !!menuEndpoint,
  });

  const filteredMenuItems = useMemo(() => {
    if (!search) return menuItems;
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [menuItems, search]);

  // ✅ FIX: correct URL - "orders" not "order"
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post("/api/staff/pos/orders/create/", {
        table_number: selectedTable?.table_number,
        customer_name: customerName || "Walk-in",
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      });
    },
    onSuccess: () => {
      toast.success("Order placed successfully!");
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-tables"] });
      router.push("/waiter");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to place order");
    },
  });

  // Cart functions
  const addToCart = (item: MenuItem, qty: number) => {
    if (qty <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    toast.success(`${item.name} x${qty} added`, { duration: 1500 });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === id);
      if (!found) return prev;
      const nextQty = found.quantity + delta;
      if (nextQty <= 0) return prev.filter((item) => item.id !== id);
      return prev.map((item) =>
        item.id === id ? { ...item, quantity: nextQty } : item
      );
    });
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    if (!selectedTable) return toast.error("Please select a table");
    if (cart.length === 0) return toast.error("Please add items to cart");
    createOrderMutation.mutate();
  };

  const selectTableAndContinue = (table: Table) => {
    if (table.status !== "Available") {
      toast.error("This table is not available");
      return;
    }
    setSelectedTable(table);
    setStep("menu");
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* LEFT PANEL */}
      <div className="flex w-[65%] flex-col border-r border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {step === "table" ? "📋 Select Table" : "🍽️ Add Items"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {step === "table"
                  ? "Choose a table to start the order"
                  : `Table ${selectedTable?.table_number} • ${customerName || "Walk-in"}`}
              </p>
            </div>
            {step === "menu" && (
              <button
                onClick={() => setStep("table")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ← Change Table
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Table Selection */}
          {step === "table" && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Select Table
                </label>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => selectTableAndContinue(table)}
                      disabled={table.status !== "Available"}
                      className={`rounded-2xl border-2 p-4 text-center transition-all ${
                        table.status === "Available"
                          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50"
                      }`}
                    >
                      <span className="text-2xl">
                        {table.status === "Available" ? "🪑" : "🔒"}
                      </span>
                      <p className="mt-1 font-bold text-slate-900">
                        Table {table.table_number}
                      </p>
                      <p className="text-xs text-slate-500">{table.location}</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          table.status === "Available"
                            ? "bg-emerald-200 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {table.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu Selection */}
          {step === "menu" && (
            <div className="space-y-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search menu items..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              {/* Categories */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory("");
                        setSearch("");
                      }}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {activeCategory?.has_subcategories && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    {activeCategory.name} Options
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeCategory.subcategories?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          selectedSubcategory === sub.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {selectedCategory && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Menu Items
                  </label>

                  {menuLoading ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-2xl bg-slate-100"
                        />
                      ))}
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                      No items found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {filteredMenuItems.map((item) => {
                        const inCart = cart.find((c) => c.id === item.id);

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                              inCart
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              <p className="mt-1 font-semibold text-emerald-600">
                                LKR {item.price.toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value="0"
                                onChange={(e) => {
                                  const qty = Number(e.target.value);
                                  if (qty > 0) addToCart(item, qty);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                              >
                                <option value="0">+Add</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <option key={n} value={n}>
                                    +{n}
                                  </option>
                                ))}
                              </select>

                              {inCart && (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                  {inCart.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - CART */}
      <div className="flex w-[35%] flex-col bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="font-semibold text-slate-900">Cart</span>
              {cartCount > 0 && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-medium text-rose-500 hover:text-rose-600"
              >
                Clear All
              </button>
            )}
          </div>

          {selectedTable && (
            <p className="mt-2 text-sm text-slate-500">
              📍 Table {selectedTable.table_number}
              {customerName && ` • ${customerName}`}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <span className="text-4xl">🛒</span>
              <p className="mt-3 font-medium">Cart is empty</p>
              <p className="text-sm">Add items from menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        LKR {item.price.toLocaleString()} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 hover:bg-emerald-100 hover:text-emerald-600"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-bold text-emerald-600">
              LKR {cartTotal.toLocaleString()}
            </span>
          </div>

          <button
            onClick={placeOrder}
            disabled={
              cart.length === 0 ||
              !selectedTable ||
              createOrderMutation.isPending
            }
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createOrderMutation.isPending
              ? "Placing Order..."
              : `Place Order • LKR ${cartTotal.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}