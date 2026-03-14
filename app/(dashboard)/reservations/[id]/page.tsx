"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { Reservation } from "../../../utils/types";
import { Room } from "../../../utils/types";
import {
  ReservationForm,
  ReservationFormValues,
} from "../../../components/forms/ReservationForm";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function EditReservationPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.reservations, id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation>>(
        `/api/staff/reservations/${id}/`,
      );
      return res.data.data;
    },
    enabled: Number.isFinite(id),
  });

  const { data: rooms } = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>(
        "/api/staff/rooms/",
      );
      return res.data.data;
    },
  });

  const { data: reservations } = useQuery({
    queryKey: QUERY_KEYS.reservations,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/",
      );
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      await apiClient.put<ApiResponse<Reservation>>(
        `/api/staff/reservations/${id}/`,
        values,
      );
    },
    onSuccess: () => {
      toast.success("Reservation updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      router.push("/reservations");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? error?.message ?? "Failed to update reservation",
      );
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/reservations"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to Reservations
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Edit Reservation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update reservation details and status.
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
          <ReservationForm
            rooms={rooms ?? []}
            existingReservations={reservations ?? []}
            initialValues={data}
            onSubmit={(values) => updateMutation.mutateAsync(values)}
            submitLabel="Save Changes"
            isEdit
          />
        )}
      </div>
    </div>
  );
}
