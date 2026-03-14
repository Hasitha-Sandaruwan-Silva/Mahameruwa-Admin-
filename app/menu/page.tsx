"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { MenuItem } from "../../utils/types";
import { MenuTable } from "../components/tables/MenuTable";

export default function MenuIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const res = await apiClient.get<MenuItem[]>("/api/staff/menu/");
      return res.data;
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
          <h1 className="text-xl font-semibold text-slate-900">
            Manage Menu Items
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, create, update, and soft-delete menu items.
          </p>
        </div>
        <Link
          href="/menu/create"
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + Add New Item
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
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
        onEdit={(item) => {
          window.location.href = `/menu/${item.id}`;
        }}
        onDelete={(item) => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this menu item? If it is used in existing orders, it will be soft-deleted.",
          );
          if (confirmed) {
            deleteMutation.mutate(item);
          }
        }}
      />
    </div>
  );
}

