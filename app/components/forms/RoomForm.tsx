"use client";

import { FormEvent, useState, ChangeEvent } from "react";
import { Room } from "../../../utils/types";

export interface RoomFormValues {
  name: string;
  category: string;
  capacity: number;
  price: number;
  status: string;
  description?: string;
  image?: File | null;
}

interface Props {
  initialValues?: Partial<Room>;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  submitLabel?: string;
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function RoomForm({ initialValues, onSubmit, submitLabel = "Save" }: Props) {
  const [values, setValues] = useState<RoomFormValues>({
    name: initialValues?.name ?? "",
    category: initialValues?.category ?? "",
    capacity: initialValues?.capacity ?? 1,
    price: initialValues?.price ?? 0,
    description: initialValues?.description ?? "",
    status: initialValues?.status ?? "active",
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof RoomFormValues, value: string | number | File | null) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange("image", e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.category || !values.price || !values.capacity) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Name</label>
          <input type="text" value={values.name} onChange={(e) => handleChange("name", e.target.value)} required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Category</label>
          <input type="text" value={values.category} onChange={(e) => handleChange("category", e.target.value)} required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Capacity</label>
          <input type="number" min={1} value={values.capacity} onChange={(e) => handleChange("capacity", Number(e.target.value ?? 1))} required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Price (LKR)</label>
          <input type="number" min={0} value={values.price} onChange={(e) => handleChange("price", Number(e.target.value ?? 0))} required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Status</label>
          <select value={values.status} onChange={(e) => handleChange("status", e.target.value)} className={inputClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Room Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Description</label>
        <textarea value={values.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} className={`${inputClass} resize-none`} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={submitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}