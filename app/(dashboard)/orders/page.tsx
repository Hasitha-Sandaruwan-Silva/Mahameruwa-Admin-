"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Order, Room, MenuItem } from "../../utils/types";
import { OrdersTable } from "../../components/tables/OrdersTable";
import { OrderForm, OrderFormValues } from "../../components/forms/OrderForm";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  ClipboardList, 
  X, 
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

export default function OrdersIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Confirmed" | "Cancelled">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: async () => {
      const res = await apiClient.get<Order[] | ApiResponse<Order[]>>("/api/staff/orders/");
      const out = unwrap(res);
      return Array.isArray(out) ? out : [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return Array.isArray((res.data as ApiResponse<Room[]>)?.data)
        ? (res.data as ApiResponse<Room[]>).data
        : Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const res = await apiClient.get<MenuItem[] | ApiResponse<MenuItem[]>>("/api/staff/menu/");
      const out = unwrap(res);
      return Array.isArray(out) ? out : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      await apiClient.post("/api/staff/orders/", values);
    },
    onSuccess: () => {
      toast.success("Order created successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create order");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: OrderFormValues }) => {
      await apiClient.put(`/api/staff/orders/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      setEditingOrder(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update order");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (order: Order) => {
      await apiClient.delete(`/api/staff/orders/${order.id}/`);
    },
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to delete order");
    },
  });

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return data.filter((order) => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        order.customer_name?.toLowerCase().includes(searchTerm) || 
        order.room_name?.toLowerCase().includes(searchTerm) ||
        order.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            <ClipboardList size={14} /> Room Service / Kitchen
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Orders</h1>
          <p className="text-slate-500 text-sm font-medium">Track and process customer orders in real-time.</p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
           {["all", "Pending", "Confirmed", "Cancelled"].map((status) => (
             <button
               key={status}
               onClick={() => setStatusFilter(status as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
                 ${statusFilter === status 
                   ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                   : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"}`}
             >
               {status}
             </button>
           ))}
        </div>

        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, room or ID..."
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 py-3 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <OrdersTable
          items={filteredOrders}
          loading={isLoading}
          onEdit={(order) => setEditingOrder(order)}
          onDelete={(order) => {
            if (window.confirm("Are you sure you want to delete this order?")) {
              deleteMutation.mutate(order);
            }
          }}
        />
        {!isLoading && (
          <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredOrders.length} Result(s) Found</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(isCreateOpen || editingOrder) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingOrder(null); }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-950" />
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingOrder ? "Update Order" : "Place New Order"}
                  </h2>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditingOrder(null); }} className="p-2 text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>

              <OrderForm
                rooms={rooms ?? []}
                menuItems={menuItems ?? []}
                initialValues={editingOrder ? {
                  ...editingOrder,
                  menu_items: Array.isArray(editingOrder.menu_items)
                    ? editingOrder.menu_items.map((m: any) => typeof m === "object" ? m.id : Number(m))
                    : [],
                } : undefined}
                onSubmit={(values) =>
                  editingOrder 
                    ? updateMutation.mutateAsync({ id: editingOrder.id, values })
                    : createMutation.mutateAsync(values)
                }
                submitLabel={createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingOrder ? "Save Changes" : "Place Order")}
                isEdit={!!editingOrder}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}