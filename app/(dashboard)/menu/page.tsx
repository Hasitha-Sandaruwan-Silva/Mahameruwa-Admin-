"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { MenuItem } from "../../utils/types";
import { MenuTable } from "../../components/tables/MenuTable";
import { MenuForm, MenuFormValues } from "../../components/forms/MenuForm";

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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const res = await apiClient.get<MenuItem[] | ApiResponse<MenuItem[]>>(
        "/api/staff/menu/",
      );
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
    mutationFn: async ({
      id,
      values,
    }: { id: number; values: MenuFormValues }) => {
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
      toast.error(
        error?.message ??
          "Unable to delete menu item. It may be used in existing orders.",
      );
    },
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Menu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage menu items, pricing, and status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + Add New Item
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <MenuTable
        items={filteredItems}
        loading={isLoading}
        onEdit={(item) => setEditingItem(item)}
        onDelete={(item) => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this menu item?",
          );
          if (confirmed) {
            deleteMutation.mutate(item);
          }
        }}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Add New Menu Item
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create a new menu item available for orders.
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
            <MenuForm
              onSubmit={(values) => createMutation.mutateAsync(values)}
              submitLabel={createMutation.isPending ? "Creating..." : "Create"}
            />
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Edit Menu Item
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update pricing, status, and details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <MenuForm
              initialValues={editingItem}
              onSubmit={(values) =>
                updateMutation.mutateAsync({
                  id: editingItem.id,
                  values,
                })
              }
              submitLabel={
                updateMutation.isPending ? "Saving..." : "Save Changes"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
