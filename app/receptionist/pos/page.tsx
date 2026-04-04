"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

// ==================== Types ====================
interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  location: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  items_count: number;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  icon: string;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CheckedInGuest {
  id: number;
  guest_name: string;
  room: number | string;
  status: string;
}

type Step = "table" | "category" | "items";

// ==================== Main Component ====================
export default function POSPage() {
  const queryClient = useQueryClient();

  // ══════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════
  const [step, setStep] = useState<Step>("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<CheckedInGuest | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [quantityModal, setQuantityModal] = useState<MenuItem | null>(null);

  // ══════════════════════════════════════════════
  // API QUERIES
  // ══════════════════════════════════════════════
  const { data: tables = [], refetch: refetchTables } = useQuery<Table[]>({
    queryKey: ["pos-tables"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/pos/tables/");
      return res.data.data || [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["pos-categories"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/pos/categories/");
      return res.data.data || [];
    },
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["pos-menu", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const res = await apiClient.get(
        `/api/staff/pos/menu/${encodeURIComponent(selectedCategory)}/`
      );
      return res.data.data || [];
    },
    enabled: !!selectedCategory && step === "items",
  });

  const { data: checkedInGuests = [] } = useQuery<CheckedInGuest[]>({
    queryKey: ["pos-guests"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/pos/guests/");
      return res.data.data || [];
    },
  });

  // ══════════════════════════════════════════════
  // CREATE ORDER MUTATION
  // ══════════════════════════════════════════════
  const createOrderMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.post("/api/staff/pos/orders/create/", data),
    onSuccess: () => {
      toast.success("Order placed successfully!");
      resetPOS();
      refetchTables();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create order");
    },
  });

  // ══════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════
  const selectTable = (table: Table) => {
    if (table.status !== "Available") {
      toast.error("Table is not available");
      return;
    }
    setSelectedTable(table);
    setSelectedGuest(null);
    setStep("category");
  };

  const selectGuest = (guest: CheckedInGuest) => {
    setSelectedGuest(guest);
    setSelectedTable(null);
    setShowGuestModal(false);
    setStep("category");
  };

  const selectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setStep("items");
  };

  const goBack = () => {
    if (step === "items") {
      setStep("category");
      setSelectedCategory(null);
    } else if (step === "category") {
      setStep("table");
      setSelectedTable(null);
      setSelectedGuest(null);
    }
  };

  const addToCart = (item: MenuItem, quantity: number) => {
    if (quantity <= 0) return;
    
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, { ...item, quantity }];
    });
    toast.success(`${item.name} x${quantity} added!`, { duration: 1500 });
    setQuantityModal(null);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((c) => c.id !== id);
      return prev.map((c) => (c.id === id ? { ...c, quantity: newQty } : c));
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    const orderData: any = {
      customer_name: customerName || "Walk-in",
      items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
    };

    if (selectedTable) {
      orderData.table_number = selectedTable.table_number;
    }

    if (selectedGuest) {
      orderData.reservation_id = selectedGuest.id;
    }

    createOrderMutation.mutate(orderData);
  };

  const resetPOS = () => {
    setStep("table");
    setSelectedTable(null);
    setSelectedGuest(null);
    setSelectedCategory(null);
    setCart([]);
    setCustomerName("");
  };

  // ══════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-100">
      {/* ══════════════════════════════════════════════
          LEFT PANEL (70%)
      ══════════════════════════════════════════════ */}
      <div className="flex w-[70%] flex-col border-r-2 border-gray-300 bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🍽️ Restaurant POS</h1>
              <p className="text-sm text-blue-100">
                {step === "table" && "Select a table or charge to room"}
                {step === "category" && "Select a category"}
                {step === "items" && `Category: ${selectedCategory}`}
              </p>
            </div>
            <div className="flex gap-2">
              {step !== "table" && (
                <button
                  onClick={goBack}
                  className="rounded-lg bg-white/20 px-4 py-2 font-medium hover:bg-white/30"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={resetPOS}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium hover:bg-red-600"
              >
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        {(selectedTable || selectedGuest) && (
          <div className="border-b bg-green-50 px-6 py-2">
            <div className="flex items-center gap-3">
              {selectedTable && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  🪑 Table {selectedTable.table_number}
                </span>
              )}
              {selectedGuest && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                  🏨 Room {selectedGuest.room} - {selectedGuest.guest_name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ══════════════════════════════════════════════
              STEP 1: TABLE SELECTION
          ══════════════════════════════════════════════ */}
          {step === "table" && (
            <div className="space-y-6">
              {/* Room Charge Option */}
              <div>
                <h2 className="mb-3 text-lg font-bold text-gray-700">
                  🏨 Charge to Room
                </h2>
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="w-full rounded-xl border-2 border-purple-200 bg-purple-50 p-4 text-left hover:border-purple-400 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏨</span>
                    <div>
                      <p className="text-lg font-bold text-purple-700">
                        Charge to Guest Room
                      </p>
                      <p className="text-sm text-purple-500">
                        Select a checked-in guest
                      </p>
                    </div>
                    <span className="ml-auto text-2xl text-purple-400">→</span>
                  </div>
                </button>
              </div>

              {/* Tables */}
              <div>
                <h2 className="mb-3 text-lg font-bold text-gray-700">
                  🪑 Select Table
                </h2>
                <div className="grid grid-cols-5 gap-3">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => selectTable(table)}
                      disabled={table.status !== "Available"}
                      className={`flex flex-col items-center rounded-xl border-2 p-4 transition ${
                        table.status === "Available"
                          ? "border-green-200 bg-white hover:border-green-400 hover:shadow-lg"
                          : "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                      }`}
                    >
                      <span className="text-3xl">
                        {table.status === "Available" ? "🪑" : "🔒"}
                      </span>
                      <p className="mt-1 text-lg font-bold">{table.table_number}</p>
                      <p className="text-xs text-gray-500">{table.location}</p>
                      <span
                        className={`mt-1 rounded px-2 py-0.5 text-xs font-bold ${
                          table.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
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

          {/* ══════════════════════════════════════════════
              STEP 2: CATEGORY SELECTION
          ══════════════════════════════════════════════ */}
          {step === "category" && (
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.name)}
                  className="flex flex-col items-center rounded-xl border-2 border-gray-200 bg-white p-6 transition hover:border-blue-400 hover:shadow-lg"
                >
                  <span className="text-5xl">{cat.icon}</span>
                  <p className="mt-2 text-lg font-bold text-gray-800">{cat.name}</p>
                  <span className="mt-1 text-sm text-gray-500">
                    {cat.items_count} items
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 3: MENU ITEMS
          ══════════════════════════════════════════════ */}
          {step === "items" && (
            <div className="grid grid-cols-3 gap-4">
              {menuItems.length === 0 ? (
                <div className="col-span-3 py-20 text-center">
                  <span className="text-6xl">📭</span>
                  <p className="mt-4 text-lg text-gray-500">
                    No items in this category
                  </p>
                </div>
              ) : (
                menuItems.map((item) => {
                  const inCart = cart.find((c) => c.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setQuantityModal(item)}
                      className={`relative flex flex-col rounded-xl border-2 bg-white p-4 text-left transition hover:shadow-lg ${
                        inCart
                          ? "border-blue-400 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {inCart && (
                        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                          {inCart.quantity}
                        </div>
                      )}
                      <span className="text-3xl">{item.icon}</span>
                      <p className="mt-2 font-bold text-gray-800">{item.name}</p>
                      <p className="text-xl font-bold text-blue-600">
                        LKR {item.price.toLocaleString()}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL - CART (30%)
      ══════════════════════════════════════════════ */}
      <div className="flex w-[30%] flex-col bg-white">
        {/* Cart Header */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <span className="text-lg font-bold">Order</span>
              {cartCount > 0 && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-sm font-bold text-white">
                  {cartCount}
                </span>
              )}
            </div>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-30"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Customer Name */}
        <div className="border-b p-3">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name (optional)"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-400"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <span className="text-5xl">🛒</span>
              <p className="mt-3 font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 p-3"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      LKR {item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-500 shadow"
                    >
                      +
                    </button>
                  </div>
                  <p className="w-16 text-right text-sm font-bold">
                    {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-blue-600">LKR {cartTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="p-4">
          <button
            onClick={placeOrder}
            disabled={cart.length === 0 || createOrderMutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
          >
            {createOrderMutation.isPending ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          GUEST SELECTION MODAL
      ══════════════════════════════════════════════ */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">🏨 Select Guest</h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {checkedInGuests.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <span className="text-4xl">🏨</span>
                  <p className="mt-2">No checked-in guests</p>
                </div>
              ) : (
                checkedInGuests.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => selectGuest(guest)}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-100 p-3 text-left hover:border-purple-300 hover:shadow"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-lg font-bold text-purple-600">
                      {guest.room}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{guest.guest_name}</p>
                      <p className="text-sm text-gray-500">Room {guest.room}</p>
                    </div>
                    <span className="text-xl text-purple-400">→</span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setShowGuestModal(false)}
              className="mt-4 w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          QUANTITY MODAL
      ══════════════════════════════════════════════ */}
      {quantityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <span className="text-5xl">{quantityModal.icon}</span>
              <h2 className="mt-2 text-xl font-bold">{quantityModal.name}</h2>
              <p className="text-lg font-bold text-blue-600">
                LKR {quantityModal.price.toLocaleString()}
              </p>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              Select quantity
            </p>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                <button
                  key={qty}
                  onClick={() => addToCart(quantityModal, qty)}
                  className="flex h-12 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-blue-600 hover:bg-blue-100"
                >
                  {qty}
                </button>
              ))}
            </div>

            <button
              onClick={() => setQuantityModal(null)}
              className="mt-4 w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}