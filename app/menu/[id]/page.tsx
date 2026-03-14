"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { MenuItem } from "../../../utils/types";
import { MenuForm, MenuFormValues } from "../../components/forms/MenuForm";

export default function EditMenuPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.menu, id],
    queryFn: async () => {
      const res = await apiClient.get<MenuItem>(`/api/staff/menu/${id}/`);
      return res.data;
    },
    enabled: Number.isFinite(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: MenuFormValues) => {
      await apiClient.put(`/api/staff/menu/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Menu item updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu });
      router.push("/menu");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to update menu item");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Edit Menu Item
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update pricing, status, and details of this menu item.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {isLoading || !data ? (
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <MenuForm
            initialValues={data}
            onSubmit={(values) => updateMutation.mutateAsync(values)}
            submitLabel="Save Changes"
            onCancel={() => router.back()}
          />
        )}
      </div>
    </div>
  );
}

