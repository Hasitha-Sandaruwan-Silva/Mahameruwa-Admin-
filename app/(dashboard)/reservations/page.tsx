"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Reservation } from "../../utils/types";
import { Room } from "../../utils/types";
import { ReservationsTable } from "../../components/tables/ReservationsTable";
import {
  ReservationForm,
  ReservationFormValues,
} from "../../components/forms/ReservationForm";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function ReservationsIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Pending" | "Confirmed" | "Cancelled" | "Completed"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.reservations,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/",
      );
      return res.data.data;
    },
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

  const createMutation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      await apiClient.post<ApiResponse<Reservation>>(
        "/api/staff/reservations/",
        values,
      );
    },
    onSuccess: () => {
      toast.success("Reservation created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create reservation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reservation: Reservation) => {
      await apiClient.delete(`/api/staff/reservations/${reservation.id}/`);
    },
    onSuccess: () => {
      toast.success("Reservation deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to delete reservation");
    },
  });

  const filteredReservations = useMemo(() => {
    if (!data) return [];
    return data.filter((res) => {
      const matchesSearch =
        !search ||
        res.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (res.room_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        res.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reservations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage room reservations, check-in, and check-out dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            + New Reservation
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, room, or email..."
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as
                | "all"
                | "Pending"
                | "Confirmed"
                | "Cancelled"
                | "Completed",
            )
          }
          className="rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <ReservationsTable
        items={filteredReservations}
        loading={isLoading}
        onEdit={(res) => {
          window.location.href = `/reservations/${res.id}`;
        }}
        onDelete={(res) => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this reservation?",
          );
          if (confirmed) {
            deleteMutation.mutate(res);
          }
        }}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  New Reservation
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create a reservation. Availability is checked before submit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <ReservationForm
              rooms={rooms ?? []}
              existingReservations={data ?? []}
              onSubmit={(values) => createMutation.mutateAsync(values)}
              submitLabel={createMutation.isPending ? "Creating..." : "Create"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
