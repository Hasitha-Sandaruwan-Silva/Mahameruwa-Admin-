"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { MenuForm, MenuFormValues } from "../../components/forms/MenuForm";

export default function CreateMenuPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: MenuFormValues) => {
      await apiClient.post("/api/staff/menu/", values);
    },
    onSuccess: () => {
      toast.success("Menu item created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu });
      router.push("/menu");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to create menu item");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Add Menu Item
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new menu item available for staff orders.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <MenuForm
          onSubmit={(values) => createMutation.mutateAsync(values)}
          submitLabel="Create Item"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

