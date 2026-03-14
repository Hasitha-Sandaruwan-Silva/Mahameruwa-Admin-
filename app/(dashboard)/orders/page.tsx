"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Order } from "../../utils/types";
import { Room } from "../../utils/types";
import { MenuItem } from "../../utils/types";
import { OrdersTable } from "../../components/tables/OrdersTable";
import {
  OrderForm,
  OrderFormValues,
} from "../../components/forms/OrderForm";

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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Pending" | "Confirmed" | "Cancelled"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: async () => {
      const res = await apiClient.get<Order[] | ApiResponse<Order[]>>(
        "/api/staff/orders/",
      );
      const out = unwrap(res);
      return Array.isArray(out) ? out : [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>(
        "/api/staff/rooms/",
      );
      return Array.isArray((res.data as ApiResponse<Room[]>)?.data)
        ? (res.data as ApiResponse<Room[]>).data
        : Array.isArray(res.data)
          ? res.data
          : [];
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const res = await apiClient.get<MenuItem[] | ApiResponse<MenuItem[]>>(
        "/api/staff/menu/",
      );
      const out = unwrap(res);
      return Array.isArray(out) ? out : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      await apiClient.post("/api/staff/orders/", values);
    },
    onSuccess: () => {
      toast.success("Order created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "Failed to create order",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: { id: number; values: OrderFormValues }) => {
      await apiClient.put(`/api/staff/orders/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      setEditingOrder(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "Failed to update order",
      );
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
      const matchesSearch =
        !search ||
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (order.room_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus =
        statusFilter === "all" ? true : order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage room service orders and status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + New Order
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or room..."
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "all" | "Pending" | "Confirmed" | "Cancelled",
            )
          }
          className="rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <OrdersTable
        items={filteredOrders}
        loading={isLoading}
        onEdit={(order) => setEditingOrder(order)}
        onDelete={(order) => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this order?",
          );
          if (confirmed) {
            deleteMutation.mutate(order);
          }
        }}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  New Order
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create an order. Only active menu items can be selected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <OrderForm
              rooms={rooms ?? []}
              menuItems={menuItems ?? []}
              onSubmit={(values) => createMutation.mutateAsync(values)}
              submitLabel={createMutation.isPending ? "Creating..." : "Create"}
            />
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Edit Order
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update order status and menu items.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <OrderForm
              rooms={rooms ?? []}
              menuItems={menuItems ?? []}
              initialValues={{
                ...editingOrder,
                menu_items: Array.isArray(editingOrder.menu_items)
                  ? editingOrder.menu_items.map((m: unknown) =>
                      typeof m === "object" && m !== null && "id" in m
                        ? (m as { id: number }).id
                        : Number(m),
                    )
                  : [],
              }}
              onSubmit={(values) =>
                updateMutation.mutateAsync({
                  id: editingOrder.id,
                  values,
                })
              }
              submitLabel={
                updateMutation.isPending ? "Saving..." : "Save Changes"
              }
              isEdit
            />
          </div>
        </div>
      )}
    </div>
  );
}
