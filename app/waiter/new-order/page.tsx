"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

interface ApiResponse<T> {
  success: boolean;
  message: string;
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
  subcategories?: {
    id: string;
    name: string;
    icon: string;
  }[];
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category: string;
  icon?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function NewOrderPage() {
  const queryClient = useQueryClient();

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ["waiter-pos-tables"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Table[]>>("/api/staff/pos/tables/");
      return res.data.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["waiter-pos-categories"],
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

  // Fetch menu
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["waiter-pos-menu", selectedCategory, selectedSubcategory],
    queryFn: async () => {
      if (!menuEndpoint) return [];
      const res = await apiClient.get<ApiResponse<MenuItem[]>>(menuEndpoint);
      return res.data.data || [];
    },
    enabled: !!menuEndpoint,
  });

  // Create order
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post("/api/staff/pos/order/create/", {
        table_number: selectedTable?.table_number,
        customer_name: customerName || "Walk-in",
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      });
    },
    onSuccess: () => {
      toast.success("Order placed successfully!");
      setSelectedTable(null);
      setCustomerName("");
      setSelectedCategory("");
      setSelectedSubcategory("");
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["waiter-pos-tables"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-tables"] });
      queryClient.invalidateQueries({ queryKey: ["waiter-kitchen-orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to place order");
    },
  });

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

    toast.success(`${item.name} x${qty} added`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === id);
      if (!found) return prev;

      const nextQty = found.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((item) => item.id !== id);
      }

      return prev.map((item) =>
        item.id === id ? { ...item, quantity: nextQty } : item
      );
    });
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const placeOrder = () => {
    if (!selectedTable) {
      toast.error("Please select a table");
      return;
    }

    if (cart.length === 0) {
      toast.error("Please add items");
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <div className="flex h-[calc(100vh-40px)] overflow-hidden rounded-3xl bg-white shadow-sm">
      {/* LEFT SIDE */}
      <div className="flex w-[70%] flex-col border-r border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Take New Order</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select table, choose items, and place the order
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Table Selection */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">1. Select Table</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => table.status === "Available" && setSelectedTable(table)}
                  disabled={table.status !== "Available"}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedTable?.id === table.id
                      ? "border-emerald-500 bg-emerald-50"
                      : table.status !== "Available"
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-slate-900">Table {table.table_number}</p>
                  <p className="mt-1 text-xs text-slate-500">{table.location}</p>
                  <p className="mt-2 text-xs font-medium text-slate-600">{table.status}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">2. Customer Name</h2>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional customer name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Categories */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">3. Select Category</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory("");
                  }}
                  className={`rounded-2xl border p-4 text-center transition ${
                    selectedCategory === cat.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-3xl">{cat.icon}</div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          {activeCategory?.has_subcategories && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">4. Select Subcategory</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {activeCategory.subcategories?.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`rounded-2xl border p-4 text-center transition ${
                      selectedSubcategory === sub.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-3xl">{sub.icon}</div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{sub.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          {selectedCategory && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">5. Add Items</h2>

              {menuLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : menuItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                  No items found
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description || item.category}
                          </p>
                          <p className="mt-2 text-lg font-bold text-emerald-600">
                            LKR {Number(item.price).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            defaultValue="0"
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              if (qty > 0) addToCart(item, qty);
                              e.target.value = "0";
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          >
                            <option value="0">+ Add</option>
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                              <option key={n} value={n}>Add {n}</option>
                            ))}
                          </select>

                          {inCart && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                              {inCart.quantity}
                            </div>
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
      </div>

      {/* RIGHT SIDE - CART */}
      <div className="flex w-[30%] flex-col bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm font-medium text-rose-500 hover:text-rose-600"
              >
                Clear
              </button>
            )}
          </div>

          {selectedTable && (
            <p className="mt-2 text-sm text-slate-500">
              Table <span className="font-semibold text-slate-700">{selectedTable.table_number}</span>
            </p>
          )}

          <p className="mt-1 text-sm text-slate-500">
            Total Items: <span className="font-semibold text-slate-700">{cartCount}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl">🛒</div>
              <p className="mt-3 font-medium">No items added yet</p>
              <p className="text-sm">Select items from menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        LKR {Number(item.price).toLocaleString()} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-slate-400 hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-emerald-100 hover:text-emerald-600"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-bold text-slate-800">
                      LKR {(Number(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-emerald-600">
              LKR {cartTotal.toLocaleString()}
            </p>
          </div>

          <button
            onClick={placeOrder}
            disabled={cart.length === 0 || createOrderMutation.isPending}
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
          >
            {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}