"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { MenuItem } from "../../utils/types";
import { MenuTable } from "../../components/tables/MenuTable";
import { MenuForm, MenuFormValues } from "../../components/forms/MenuForm";
import { motion, AnimatePresence } from "framer-motion"; // Animation සඳහා
import { 
  Search, 
  Plus, 
  Filter, 
  UtensilsCrossed, 
  X, 
  ChevronRight,
  Database
} from "lucide-react";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrap<T>(res: { data: T | ApiResponse<T> }): T {
  const d = res.data as ApiResponse<T>;
  if (d && typeof d === "object" && "data" in d && d.data !== undefined) {
    return d.data;
  }
  return res.data as T;
}

export default function MenuIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // --- Logics (Unchanged) ---
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const res = await apiClient.get<MenuItem[] | ApiResponse<MenuItem[]>>("/api/staff/menu/");
      return Array.isArray(unwrap(res)) ? unwrap(res) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: MenuFormValues) => {
      await apiClient.post("/api/staff/menu/", values);
    },
    onSuccess: () => {
      toast.success("Menu item created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to create menu item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: MenuFormValues }) => {
      await apiClient.put(`/api/staff/menu/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Menu item updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to update menu item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      await apiClient.delete(`/api/staff/menu/${item.id}/`);
    },
    onSuccess: () => {
      toast.success("Menu item deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to delete item. Check if it's in active orders.");
    },
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      const matchesSearch = !search || 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            <UtensilsCrossed size={14} /> Inventory / Catalog
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Menu Management
          </h1>
          <p className="text-slate-500 text-sm font-medium">Configure items, pricing and availability.</p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {/* --- Search & Filters --- */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
            {filteredItems.length} Items Found
          </div>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <MenuTable
          items={filteredItems}
          loading={isLoading}
          onEdit={(item) => setEditingItem(item)}
          onDelete={(item) => {
            const confirmed = window.confirm("Are you sure you want to delete this menu item?");
            if (confirmed) deleteMutation.mutate(item);
          }}
        />
      </div>

      {/* --- Modals (Create & Edit) --- */}
      <AnimatePresence>
        {(isCreateOpen || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingItem(null); }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl overflow-hidden"
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-950" />
              
              <div className="mb-8 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingItem ? "Edit Menu Item" : "Create New Item"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingItem ? "Modify pricing and details for this item." : "Add a new dish or service to your catalog."}
                  </p>
                </div>
                <button
                  onClick={() => { setIsCreateOpen(false); setEditingItem(null); }}
                  className="rounded-full p-2 hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative">
                <MenuForm
                  initialValues={editingItem || undefined}
                  onSubmit={(values) =>
                    editingItem 
                      ? updateMutation.mutateAsync({ id: editingItem.id, values })
                      : createMutation.mutateAsync(values)
                  }
                  submitLabel={
                    createMutation.isPending || updateMutation.isPending 
                      ? "Processing..." 
                      : (editingItem ? "Save Changes" : "Create Item")
                  }
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}