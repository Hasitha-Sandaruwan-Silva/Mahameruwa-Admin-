"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  stock: number;
  min_stock: number;
  unit: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const CATEGORY_OPTIONS = [
  "Housekeeping",
  "Kitchen",
  "Toiletries",
  "General",
];

const emptyForm = {
  item_name: "",
  category: "Kitchen",
  stock: 0,
  min_stock: 10,
  unit: "",
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function BarmanStockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "good">("all");

  // ══════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<InventoryItem[]>>("/api/staff/inventory/");
      setItems(res.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ══════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.item_name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (!form.unit.trim()) {
      toast.error("Unit is required");
      return;
    }
    if (Number(form.stock) < 0) {
      toast.error("Stock cannot be negative");
      return;
    }
    if (Number(form.min_stock) < 0) {
      toast.error("Minimum stock cannot be negative");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        item_name: form.item_name.trim(),
        category: form.category,
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        unit: form.unit.trim(),
      };

      if (editingId) {
        await apiClient.put(`/api/staff/inventory/${editingId}/`, payload);
        toast.success("Item updated successfully");
      } else {
        await apiClient.post("/api/staff/inventory/", payload);
        toast.success("Item added successfully");
      }

      resetForm();
      fetchInventory();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      item_name: item.item_name,
      category: item.category,
      stock: item.stock,
      min_stock: item.min_stock,
      unit: item.unit,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await apiClient.delete(`/api/staff/inventory/${id}/`);
      toast.success("Item deleted");
      fetchInventory();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete item");
    }
  };

  const handleQuickUpdate = async (id: number, newStock: number) => {
    if (newStock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    try {
      await apiClient.put(`/api/staff/inventory/${id}/`, { stock: newStock });
      toast.success("Stock updated");
      fetchInventory();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update stock");
    }
  };

  // ══════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════

  const filteredItems = useMemo(() => {
    let result = items;

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "low") {
      result = result.filter((item) => item.stock <= item.min_stock);
    } else if (stockFilter === "good") {
      result = result.filter((item) => item.stock > item.min_stock);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.item_name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, categoryFilter, stockFilter, search]);

  const stats = useMemo(() => {
    const lowStock = items.filter((item) => item.stock <= item.min_stock).length;
    const totalStock = items.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const categories = [...new Set(items.map((item) => item.category))].length;

    return { total: items.length, lowStock, totalStock, categories };
  }, [items]);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">📦 Stock Management</h1>
          <p className="mt-1 text-sm text-slate-500">Track bar inventory and stock levels</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 transition-colors"
        >
          {showForm ? (
            <>
              <span>✕</span> Close Form
            </>
          ) : (
            <>
              <span>+</span> Add Item
            </>
          )}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Low Stock</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{stats.lowStock}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Total Units</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.totalStock}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">Categories</p>
          <p className="mt-2 text-2xl font-bold text-violet-800">{stats.categories}</p>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Item" : "Add New Item"}
              </h2>
              <p className="text-sm text-slate-500">
                {editingId ? "Update item details" : "Add a new inventory item"}
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

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.item_name}
                onChange={(e) => setForm((prev) => ({ ...prev, item_name: e.target.value }))}
                placeholder="Whiskey"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900 bg-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Min Stock</label>
              <input
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => setForm((prev) => ({ ...prev, min_stock: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="bottles"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="flex items-end gap-3 md:col-span-2 lg:col-span-5">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Item" : "Add Item")}
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

      {/* FILTERS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStockFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stockFilter === "all" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter("low")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stockFilter === "low" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Low Stock
            {stats.lowStock > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 text-white px-1 text-xs">
                {stats.lowStock}
              </span>
            )}
          </button>
          <button
            onClick={() => setStockFilter("good")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stockFilter === "good" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Good Stock
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 bg-white outline-none focus:border-rose-500"
          >
            <option value="all" className="text-slate-900 bg-white">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat} className="text-slate-900 bg-white">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full sm:w-64 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Item
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Min Stock
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
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
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-rose-600" />
                      <span className="text-sm text-slate-500">Loading inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    {search || categoryFilter !== "all" || stockFilter !== "all"
                      ? "No items match your filters"
                      : "No inventory items yet. Add your first item!"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.stock <= item.min_stock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{item.item_name}</p>
                          <p className="text-xs text-slate-500">
                            Added {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.category}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickUpdate(item.id, item.stock - 1)}
                            className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                          >
                            −
                          </button>
                          <span className="font-semibold text-slate-900 w-12 text-center">{item.stock}</span>
                          <button
                            onClick={() => handleQuickUpdate(item.id, item.stock + 1)}
                            className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.min_stock}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.unit}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isLowStock ? "⚠ Low Stock" : "✓ In Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
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
    </div>
  );
}