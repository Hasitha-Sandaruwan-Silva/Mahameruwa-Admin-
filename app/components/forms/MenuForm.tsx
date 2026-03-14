"use client";

import { FormEvent, useState } from "react";
import { MenuItem } from "../../../utils/types";

export interface MenuFormValues {
  name: string;
  category: string;
  price: number;
  description?: string;
  status: string;
}

interface Props {
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: MenuFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function MenuForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: Props) {
  const [values, setValues] = useState<MenuFormValues>({
    name: initialValues?.name ?? "",
    category: initialValues?.category ?? "",
    price: initialValues?.price ?? 0,
    description: initialValues?.description ?? "",
    status: initialValues?.status ?? "active",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    field: keyof MenuFormValues,
    value: string | number,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.category || !values.price) {
      return;
    }
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
          <input
            type="text"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Category
          </label>
          <input
            type="text"
            value={values.category}
            onChange={(e) => handleChange("category", e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Price (LKR)
          </label>
          <input
            type="number"
            value={values.price}
            onChange={(e) =>
              handleChange("price", Number(e.target.value ?? 0))
            }
            min={0}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Status</label>
          <select
            value={values.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">
          Description
        </label>
        <textarea
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

