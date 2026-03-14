"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { Room } from "../../../utils/types";
import { RoomForm, RoomFormValues } from "../../../components/forms/RoomForm";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function EditRoomPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.rooms, id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room>>(
        `/api/staff/rooms/${id}/`,
      );
      return res.data.data;
    },
    enabled: Number.isFinite(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: RoomFormValues) => {
      await apiClient.put<ApiResponse<Room>>(`/api/staff/rooms/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Room updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      router.push("/rooms");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to update room");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edit Room</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update pricing, capacity, and details of this room.
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
          <RoomForm
            initialValues={data}
            onSubmit={(values) => updateMutation.mutateAsync(values)}
            submitLabel="Save Changes"
          />
        )}
      </div>
    </div>
  );
}

