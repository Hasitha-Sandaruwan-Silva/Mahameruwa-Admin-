"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Order } from "../../utils/types";
import { Room } from "../../utils/types";
import { MenuItem } from "../../utils/types";

export interface OrderFormValues {
  customer_name: string;
  room: number;
  menu_items: number[];
  status: string;
}

interface Props {
  rooms: Room[];
  menuItems: MenuItem[];
  initialValues?: Partial<Order>;
  onSubmit: (values: OrderFormValues) => Promise<void> | void;
  submitLabel?: string;
  isEdit?: boolean;
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function OrderForm({ rooms, menuItems, initialValues, onSubmit, submitLabel = "Save", isEdit = false }: Props) {
  const [values, setValues] = useState<OrderFormValues>({
    customer_name: initialValues?.customer_name ?? "",
    room: initialValues?.room ?? (rooms[0]?.id ?? 0),
    menu_items: initialValues?.menu_items ?? [],
    status: initialValues?.status ?? "Pending",
  });
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const activeMenuItems = menuItems.filter(
    (m) => m.status === "active" || (isEdit && initialValues?.menu_items?.includes(m.id)),
  );
  const activeRooms = rooms.filter((r) => r.status === "active");

  const handleChange = (field: keyof OrderFormValues, value: string | number | number[]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMenuItem = (id: number) => {
    setValues((prev) => {
      const current = prev.menu_items;
      if (current.includes(id)) return { ...prev, menu_items: current.filter((x) => x !== id) };
      return { ...prev, menu_items: [...current, id] };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.customer_name || !values.room || values.menu_items.length === 0) return;
    if (!isEdit) {
      const hasInactive = values.menu_items.some((id) => {
        const item = menuItems.find((m) => m.id === id);
        return item && item.status !== "active";
      });
      if (hasInactive) return;
    }
    try {
      setSubmitting(true);
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedNames = activeMenuItems
    .filter((m) => values.menu_items.includes(m.id))
    .map((m) => m.name);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Customer Name</label>
          <input type="text" value={values.customer_name} onChange={(e) => handleChange("customer_name", e.target.value)} required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Room</label>
          <select value={values.room || ""} onChange={(e) => handleChange("room", Number(e.target.value))} required disabled={activeRooms.length === 0}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}>
            <option value="">{activeRooms.length === 0 ? "No active rooms" : "Select room"}</option>
            {activeRooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name} - {room.category}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-700">Menu Items (active only)</label>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((o) => !o)}
              className="flex min-h-[42px] w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <span className="text-slate-600">
                {values.menu_items.length === 0 ? "Select menu items..." : selectedNames.join(", ")}
              </span>
              <span className="text-slate-400">▼</span>
            </button>
            {menuOpen && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {activeMenuItems.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">No active menu items</div>
                ) : (
                  activeMenuItems.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 hover:bg-slate-50 last:border-0">
                      <input type="checkbox" checked={values.menu_items.includes(item.id)} onChange={() => toggleMenuItem(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm text-slate-900">{item.name}</span>
                      <span className="ml-auto text-xs text-slate-500">LKR {item.price.toLocaleString()}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          {values.menu_items.length === 0 && (
            <p className="text-xs text-amber-600">Select at least one menu item. Only active items are shown.</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Status</label>
          <select value={values.status} onChange={(e) => handleChange("status", e.target.value)} className={inputClass}>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={submitting || values.menu_items.length === 0}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}