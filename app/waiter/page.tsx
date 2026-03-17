"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../utils/api";
import { Order, MenuItem } from "../../utils/types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Main Course": "bg-orange-100 text-orange-700",
  "Dessert": "bg-pink-100 text-pink-700",
  "Beverage": "bg-blue-100 text-blue-700",
  "Starter": "bg-green-100 text-green-700",
};

export default function WaiterMenuPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["waiter-menu"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MenuItem[]>>("/api/staff/menu/");
      return res.data.data.filter((item) => item.status === "active");
    },
  });

  const categories = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))];

  const filtered = menuItems.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || item.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Menu</h1>
        <p className="text-sm text-slate-500 mt-1">View all available menu items.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="flex-1 min-w-[200px] rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No menu items found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-slate-900 text-sm">{item.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] ?? "bg-slate-100 text-slate-600"}`}>
                  {item.category}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-500">{item.description}</p>
              )}
              <p className="text-emerald-600 font-semibold text-sm">
                LKR {Number(item.price).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}