"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { apiClient } from "../../utils/api";

interface MenuItem {
  id: number;
  name: string;
  category: string;
}

interface NewBottle {
  barcode_id: string;
  menu_item_name: string;
}

const CATEGORY_CONFIG: Record<string, { bg: string; text: string; icon: string; gradient: string }> = {
  Beverage: { 
    bg: "bg-gradient-to-r from-sky-100 to-blue-100", 
    text: "text-sky-700",
    icon: "🥤",
    gradient: "from-sky-500 to-blue-600"
  },
  Cocktail: { 
    bg: "bg-gradient-to-r from-violet-100 to-purple-100", 
    text: "text-violet-700",
    icon: "🍸",
    gradient: "from-violet-500 to-purple-600"
  },
  Wine: { 
    bg: "bg-gradient-to-r from-rose-100 to-pink-100", 
    text: "text-rose-700",
    icon: "🍷",
    gradient: "from-rose-500 to-pink-600"
  },
  Spirit: { 
    bg: "bg-gradient-to-r from-amber-100 to-orange-100", 
    text: "text-amber-700",
    icon: "🥃",
    gradient: "from-amber-500 to-orange-600"
  },
  Beer: { 
    bg: "bg-gradient-to-r from-yellow-100 to-amber-100", 
    text: "text-yellow-700",
    icon: "🍺",
    gradient: "from-yellow-500 to-amber-600"
  },
};

const StickerToPrint = ({ bottle }: { bottle: NewBottle }) => (
  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3">
    <div className="flex flex-col items-center justify-center">
      <p className="mb-2 text-center text-xs font-bold text-slate-800">
        {bottle.menu_item_name}
      </p>
      <Barcode
        value={bottle.barcode_id}
        width={1.2}
        height={36}
        fontSize={10}
        margin={2}
      />
    </div>
  </div>
);

// Floating animated background shapes
const FloatingShapes = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -left-20 -top-20 h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-rose-200/30 to-orange-200/30 blur-3xl" />
    <div className="absolute -right-32 top-1/3 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-violet-200/30 to-indigo-200/30 blur-3xl" style={{ animationDelay: "1s" }} />
    <div className="absolute -bottom-20 left-1/3 h-64 w-64 animate-pulse rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl" style={{ animationDelay: "2s" }} />
  </div>
);

// Stat card with glow effect
const StatCard = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
  <div className={`group relative overflow-hidden rounded-2xl bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
    <div className="relative">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function BarmanStockInPage() {
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [newlyAddedBottles, setNewlyAddedBottles] = useState<NewBottle[]>([]);
  const [search, setSearch] = useState("");

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["liquor-menu-items"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: MenuItem[] }>("/api/staff/menu/");
      const liquorCategories = ["Beverage", "Cocktail", "Wine", "Spirit", "Beer"];
      return res.data.data.filter((item) =>
        liquorCategories.includes(item.category)
      );
    },
  });

  const stockInMutation = useMutation({
    mutationFn: (data: { menu_item_id: string; quantity: number }) => {
      return apiClient.post("/api/staff/barman/stock-in/", data);
    },
    onSuccess: (res) => {
      setNewlyAddedBottles(res.data.data);
      toast.success(res.data.message);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to add stock."),
  });

  const handlePrint = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: "bottle-barcodes",
  });

  const handleAddStock = () => {
    if (!selectedItem || quantity <= 0) {
      toast.error("Please select an item and enter a valid quantity.");
      return;
    }

    setNewlyAddedBottles([]);
    stockInMutation.mutate({ menu_item_id: selectedItem, quantity });
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [menuItems, search]);

  const selectedMenuItem = useMemo(() => {
    return menuItems.find((item) => String(item.id) === selectedItem) || null;
  }, [menuItems, selectedItem]);

  return (
    <div className="relative min-h-screen space-y-8 p-4 lg:p-6">
      <FloatingShapes />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Glowing orbs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/30 to-orange-500/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                Barman Portal Active
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Stock In & Barcode
              <span className="block bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Generation System
              </span>
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-slate-400">
              Streamline your bar inventory with intelligent barcode tracking. 
              Generate unique labels for each bottle and scan them during sales.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard 
              label="Items" 
              value={menuItems.length} 
              icon="📦" 
              color="from-blue-500 to-cyan-500" 
            />
            <StatCard 
              label="Quantity" 
              value={quantity} 
              icon="🔢" 
              color="from-violet-500 to-purple-500" 
            />
            <StatCard 
              label="Generated" 
              value={newlyAddedBottles.length} 
              icon="🏷️" 
              color="from-emerald-500 to-teal-500" 
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-2">
        
        {/* LEFT PANEL - Selection */}
        <div className="group relative overflow-hidden rounded-[2rem] bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:shadow-2xl">
          {/* Hover glow effect */}
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20" />
          
          <div className="relative space-y-6">
            {/* Section Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-2xl shadow-lg shadow-rose-500/30">
                  🍾
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Select Bottle</h2>
                  <p className="text-sm text-slate-500">Choose item & quantity</p>
                </div>
              </div>
              <div className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-500/30">
                Step 1
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category..."
                className="w-full rounded-2xl border-2 border-slate-200 bg-white/80 py-4 pl-12 pr-4 text-sm text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            {/* Item Selection Grid */}
            <div className="max-h-[350px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-4">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-200" />
                      <div className="flex-1">
                        <div className="h-4 w-32 rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12">
                  <span className="mb-3 text-4xl">🔍</span>
                  <p className="font-medium text-slate-600">No items found</p>
                  <p className="text-sm text-slate-400">Try a different search</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItem === String(item.id);
                  const config = CATEGORY_CONFIG[item.category] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    icon: "📦",
                    gradient: "from-slate-500 to-slate-600"
                  };

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(String(item.id))}
                      className={`group/item relative w-full overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                        isSelected
                          ? `border-transparent bg-gradient-to-r ${config.gradient} shadow-lg`
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover/item:scale-110 ${
                          isSelected ? "bg-white/20" : config.bg
                        }`}>
                          {config.icon}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className={`truncate font-semibold ${isSelected ? "text-white" : "text-slate-800"}`}>
                            {item.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                              isSelected ? "bg-white/20 text-white/90" : `${config.bg} ${config.text}`
                            }`}>
                              {item.category}
                            </span>
                            <span className={`text-xs ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                              ID: {item.id}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Preview */}
            {selectedMenuItem && (
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${CATEGORY_CONFIG[selectedMenuItem.category]?.bg || "bg-slate-100"}`}>
                    {CATEGORY_CONFIG[selectedMenuItem.category]?.icon || "📦"}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Selected</p>
                    <p className="text-lg font-bold text-slate-800">{selectedMenuItem.name}</p>
                    <p className="text-sm text-slate-500">{selectedMenuItem.category}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-5">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-600">
                Quantity to Generate
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-600 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-rose-50 hover:text-rose-600 hover:shadow-xl active:scale-95"
                >
                  −
                </button>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="h-16 w-28 rounded-2xl border-2 border-slate-200 bg-white text-center text-3xl font-bold text-slate-800 shadow-inner outline-none transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-600 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-xl active:scale-95"
                >
                  +
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                Each bottle gets a unique barcode label
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleAddStock}
              disabled={stockInMutation.isPending || !selectedItem}
              className="group/btn relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 p-[2px] shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/30 disabled:opacity-50 disabled:hover:shadow-xl"
            >
              <div className="relative flex items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-6 py-4 transition-all duration-300 group-hover/btn:bg-transparent">
                {stockInMutation.isPending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-bold text-white">Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🏷️</span>
                    <span className="text-sm font-bold text-white">
                      Generate {quantity} Barcode{quantity > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - Generated Barcodes */}
        <div className="group relative overflow-hidden rounded-[2rem] bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:shadow-2xl">
          {/* Hover glow effect */}
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20" />
          
          <div className="relative space-y-6">
            {/* Section Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-lg shadow-emerald-500/30">
                  🖨️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Print Preview</h2>
                  <p className="text-sm text-slate-500">Ready to print labels</p>
                </div>
              </div>
              {newlyAddedBottles.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                  </span>
                  {newlyAddedBottles.length} Ready
                </div>
              )}
            </div>

            {newlyAddedBottles.length > 0 ? (
              <>
                {/* Barcode Grid */}
                <div
                  ref={printAreaRef}
                  className="grid max-h-[500px] grid-cols-1 gap-4 overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:grid-cols-2"
                >
                  {newlyAddedBottles.map((bottle, index) => (
                    <div
                      key={bottle.barcode_id}
                      className="group/card relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-md transition-all duration-300 hover:border-emerald-300 hover:shadow-xl"
                    >
                      {/* Card number badge */}
                      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-lg">
                        {index + 1}
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-lg">
                          {CATEGORY_CONFIG[
                            menuItems.find(i => i.name === bottle.menu_item_name)?.category || ""
                          ]?.icon || "📦"}
                        </span>
                        <p className="truncate text-sm font-bold text-slate-700">
                          {bottle.menu_item_name}
                        </p>
                      </div>

                      <StickerToPrint bottle={bottle} />

                      <p className="mt-3 break-all rounded-lg bg-slate-50 p-2 text-center font-mono text-[10px] text-slate-500">
                        {bottle.barcode_id}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handlePrint}
                    className="group/print flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-800/30 active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover/print:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print All ({newlyAddedBottles.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewlyAddedBottles([])}
                    className="group/clear flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow-lg transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 hover:shadow-xl active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover/clear:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All
                  </button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-8 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 text-5xl shadow-inner">
                  🏷️
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-700">
                  No Barcodes Yet
                </h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
                  Select a liquor item from the left panel, set your quantity, 
                  and generate unique barcode labels for each bottle.
                </p>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">1</span>
                  Select Item
                  <span className="text-slate-400">→</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">2</span>
                  Set Qty
                  <span className="text-slate-400">→</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">3</span>
                  Generate
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}