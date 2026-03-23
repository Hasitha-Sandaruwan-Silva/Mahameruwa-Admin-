"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

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

const CATEGORY_COLORS: Record<string, string> = {
  Housekeeping: "bg-blue-100 text-blue-700",
  Kitchen: "bg-orange-100 text-orange-700",
  Toiletries: "bg-pink-100 text-pink-700",
  General: "bg-slate-100 text-slate-700",
};

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    item_name: "", category: "Housekeeping", stock: 0, min_stock: 10, unit: "units",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<InventoryItem[]>>("/api/staff/inventory/");
      return res.data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/staff/inventory/", form);
    },
    onSuccess: () => {
      toast.success("Item added!");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setForm({ item_name: "", category: "Housekeeping", stock: 0, min_stock: 10, unit: "units" });
    },
    onError: () => toast.error("Failed to add item"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form }) => {
      await apiClient.put(`/api/staff/inventory/${id}/`, data);
    },
    onSuccess: () => {
      toast.success("Item updated!");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setEditingItem(null);
    },
    onError: () => toast.error("Failed to update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/staff/inventory/${id}/`);
    },
    onSuccess: () => {
      toast.success("Item deleted!");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const categories = ["All", "Housekeeping", "Kitchen", "Toiletries", "General"];

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.item_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Stats
  const lowStock = items.filter(i => i.stock <= i.min_stock && i.stock > 0).length;
  const outOfStock = items.filter(i => i.stock === 0).length;
  const totalItems = items.length;

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (item.stock <= item.min_stock) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", color: "bg-emerald-100 text-emerald-700" };
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      item_name: item.item_name,
      category: item.category,
      stock: item.stock,
      min_stock: item.min_stock,
      unit: item.unit,
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage hotel inventory and stock levels.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Items", value: totalItems, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
          { label: "Low Stock", value: lowStock, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
          { label: "Out of Stock", value: outOfStock, color: "bg-red-400", light: "bg-red-50", text: "text-red-600" },
        ].map(({ label, value, color, light, text }) => (
          <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className={`h-8 w-8 rounded-xl ${light} flex items-center justify-center mb-3`}>
              <div className={`h-3 w-3 rounded-full ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className={`text-xs font-medium ${text} mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 min-w-[200px] rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Item Name", "Category", "Stock", "Min Stock", "Unit", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.item_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] ?? "bg-slate-100 text-slate-600"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${item.stock === 0 ? "text-red-600" : item.stock <= item.min_stock ? "text-amber-600" : "text-slate-900"}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.min_stock}</td>
                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.item_name}"?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-600"
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

      {/* Create Modal */}
      {isCreateOpen && (
        <InventoryModal
          title="Add New Item"
          form={form}
          setForm={setForm}
          inputClass={inputClass}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={() => {
            if (!form.item_name.trim()) return toast.error("Item name required");
            createMutation.mutate();
          }}
          isPending={createMutation.isPending}
          submitLabel="Add Item"
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <InventoryModal
          title="Edit Item"
          form={form}
          setForm={setForm}
          inputClass={inputClass}
          onClose={() => setEditingItem(null)}
          onSubmit={() => {
            if (!form.item_name.trim()) return toast.error("Item name required");
            updateMutation.mutate({ id: editingItem.id, data: form });
          }}
          isPending={updateMutation.isPending}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}

function InventoryModal({
  title, form, setForm, inputClass, onClose, onSubmit, isPending, submitLabel
}: {
  title: string;
  form: { item_name: string; category: string; stock: number; min_stock: number; unit: string };
  setForm: (f: any) => void;
  inputClass: string;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-full">Esc</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Item Name</label>
            <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Towels" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Toiletries">Toiletries</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Stock</label>
              <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Min Stock</label>
              <input type="number" min={0} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Unit</label>
            <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. units, kg, liters" className={inputClass} />
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isPending}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70 transition-colors"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}